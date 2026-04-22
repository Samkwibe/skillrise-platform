/**
 * Multi-provider learning-resource orchestrator.
 *
 * Mirrors `lib/jobs/search.ts`: fans out to every configured provider
 * in parallel with per-provider timeouts, merges + dedupes (by id),
 * caches the combined payload in the DynamoDB-backed tiered cache, and
 * returns both a flat list and a per-provider breakdown for diagnostics.
 *
 * Providers live in `lib/resources/providers/*` — add a new file there
 * (real API or deep-link) and register it in `ALL_PROVIDERS` below.
 */
import type {
  LearningResource,
  ResourceProvider,
  ResourceProviderResult,
  ResourceSearchOpts,
} from "./types";
import { openLibraryProvider } from "./providers/openlibrary";
import { mitOcwProvider } from "./providers/mit-ocw";
import { youtubeProvider } from "./providers/youtube";
import { wikipediaProvider } from "./providers/wikipedia";
import { openAlexProvider } from "./providers/openalex";
import { semanticScholarProvider } from "./providers/semantic-scholar";
import { internetArchiveProvider } from "./providers/internet-archive";
import { googleBooksProvider } from "./providers/google-books";
import { deepLinkProviders } from "./providers/deeplink";
import { cached } from "@/lib/cache/tiered-cache";

const ALL_PROVIDERS: ResourceProvider[] = [
  youtubeProvider,
  mitOcwProvider,
  openLibraryProvider,
  wikipediaProvider,
  openAlexProvider,
  semanticScholarProvider,
  internetArchiveProvider,
  googleBooksProvider,
  ...deepLinkProviders,
];

export function listProviders(): Array<{
  id: string;
  label: string;
  configured: boolean;
}> {
  return ALL_PROVIDERS.map((p) => ({
    id: p.id,
    label: p.label,
    configured: p.isConfigured(),
  }));
}

export type ResourceSearchResult = {
  items: LearningResource[];
  byProvider: Array<{
    provider: string;
    count: number;
    configured: boolean;
    error?: string;
  }>;
  note?: string;
};

export async function searchAllResources(
  opts: ResourceSearchOpts,
): Promise<ResourceSearchResult> {
  const query = opts.query.trim();
  if (!query) return { items: [], byProvider: [] };

  const limit = Math.min(Math.max(opts.limit ?? 8, 1), 24);
  const language = (opts.language ?? "en").slice(0, 5);
  const cacheKey = `${query}|${language}|${limit}`;

  return cached<ResourceSearchResult>(
    "resources:multi",
    cacheKey,
    async () => runAll({ ...opts, limit, language }),
    { ttlHours: Math.max(1, Number(process.env.RESOURCES_CACHE_TTL_HOURS || 24)) },
  );
}

async function runAll(opts: ResourceSearchOpts): Promise<ResourceSearchResult> {
  const results: ResourceProviderResult[] = await Promise.all(
    ALL_PROVIDERS.map(async (p) => {
      if (!p.isConfigured()) {
        return { provider: p.id, items: [], error: "not configured" };
      }
      try {
        return await withTimeout(p.search(opts), 15_000, p.id);
      } catch (e) {
        return { provider: p.id, items: [], error: (e as Error).message };
      }
    }),
  );

  // Dedupe by id. Within a single provider the ids are already unique;
  // across providers the chance of collision is effectively zero because
  // ids are prefixed by provider name.
  const seen = new Set<string>();
  const merged: LearningResource[] = [];
  for (const r of results) {
    for (const it of r.items) {
      if (seen.has(it.id)) continue;
      seen.add(it.id);
      merged.push(it);
    }
  }

  // Ranking: real items first, then deep-link shortcuts at the bottom.
  // Within each bucket, sort by publishedAt desc if known, then provider
  // priority (YouTube + MIT OCW + OpenLibrary are "content", others are
  // deep-links so they float down naturally via isDeepLink).
  const providerPriority: Record<string, number> = {
    youtube: 5,
    "mit-ocw": 5,
    openlibrary: 4,
    wikipedia: 4,
    googlebooks: 4,
    openalex: 3,
    semanticscholar: 3,
    internetarchive: 3,
    coursera: 2,
    khan: 2,
    edx: 2,
    harvard: 2,
    alison: 2,
    freecodecamp: 2,
    other: 1,
  };
  merged.sort((a, b) => {
    const aDeep = a.isDeepLink ? 1 : 0;
    const bDeep = b.isDeepLink ? 1 : 0;
    if (aDeep !== bDeep) return aDeep - bDeep;
    const prio = (providerPriority[b.provider] ?? 0) - (providerPriority[a.provider] ?? 0);
    if (prio !== 0) return prio;
    return (b.publishedAt ?? 0) - (a.publishedAt ?? 0);
  });

  const byProvider = results.map((r) => {
    const p = ALL_PROVIDERS.find((x) => x.id === r.provider);
    return {
      provider: r.provider,
      count: r.items.length,
      configured: p?.isConfigured() ?? false,
      error: r.error,
    };
  });

  let note: string | undefined;
  if (merged.length === 0) {
    note = "No matches yet. Try a simpler keyword (e.g. \"python\", \"budgeting\", \"interview\").";
  }

  return { items: merged, byProvider, note };
}

function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(
      () => reject(new Error(`${label} timed out after ${Math.round(ms / 1000)}s`)),
      ms,
    );
    p.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      },
    );
  });
}
