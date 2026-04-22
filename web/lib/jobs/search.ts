/**
 * Multi-provider jobs orchestrator.
 *
 * Fans out a single user query to every configured provider in parallel,
 * merges + dedupes results (by apply URL), caches the merged payload in
 * our DynamoDB-backed tiered cache, and hands back a flat list plus a
 * breakdown for diagnostics.
 *
 *   Remotive  — always on (no key required)
 *   Adzuna    — broad coverage, needs ADZUNA_APP_ID + _KEY (free)
 *   USAJobs   — US federal, needs USAJOBS_API_KEY + USAJOBS_EMAIL (free)
 *   Apify     — optional paid-or-free-tier actor (APIFY_API_TOKEN + APIFY_ACTOR_JOB_SCRAPER)
 *
 * Design notes:
 *   - Providers are independent. A failure in one never blocks the others.
 *   - We cache for JOBS_CACHE_TTL_HOURS (default 8h). Shorter than video
 *     search because jobs age out fast.
 *   - Dedupe key is lowercased applyUrl — different providers often return
 *     the same posting under slightly different paths.
 */
import type { JobProvider, JobSearchOpts, ScrapedJob, ProviderResult } from "./types";
import { remotiveProvider } from "./providers/remotive";
import { adzunaProvider } from "./providers/adzuna";
import { usajobsProvider } from "./providers/usajobs";
import { apifyJobsProvider } from "./providers/apify";
import { googleJobsProvider } from "./providers/google";
import { cached } from "@/lib/cache/tiered-cache";

const ALL_PROVIDERS: JobProvider[] = [
  remotiveProvider,
  adzunaProvider,
  usajobsProvider,
  apifyJobsProvider,
  googleJobsProvider,
];

export type JobsSearchResult = {
  jobs: ScrapedJob[];
  /** One entry per provider that ran, with count + any error detail. */
  byProvider: Array<{
    provider: string;
    count: number;
    configured: boolean;
    error?: string;
  }>;
  /** Human-readable note for the UI when nothing turned up. */
  note?: string;
};

export async function searchAllJobs(opts: JobSearchOpts): Promise<JobsSearchResult> {
  const query = opts.query.trim();
  if (!query) return { jobs: [], byProvider: [] };

  const limit = Math.min(Math.max(opts.limit ?? 20, 1), 60);
  const location = (opts.location ?? "").trim();
  const country = (opts.country ?? "").trim().toLowerCase();
  const cacheKey = `${query}|${location}|${country}|${limit}`;

  return cached<JobsSearchResult>(
    "jobs:multi",
    cacheKey,
    async () => runAll(opts),
    { ttlHours: Math.max(1, Number(process.env.JOBS_CACHE_TTL_HOURS || 8)) },
  );
}

async function runAll(opts: JobSearchOpts): Promise<JobsSearchResult> {
  const limit = Math.min(Math.max(opts.limit ?? 20, 1), 60);

  // Parallel fan-out, but give each provider a generous timeout so one
  // slow scraper doesn't block the others.
  const results: ProviderResult[] = await Promise.all(
    ALL_PROVIDERS.map(async (p) => {
      if (!p.isConfigured()) {
        return { provider: p.id, jobs: [], error: "not configured" } satisfies ProviderResult;
      }
      try {
        return await withTimeout(p.search({ ...opts, limit }), 25_000, p.id);
      } catch (e) {
        return { provider: p.id, jobs: [], error: (e as Error).message };
      }
    }),
  );

  // Dedupe by apply URL (fallback to title+company) so LinkedIn + Indeed
  // don't double-count the same posting.
  const seen = new Set<string>();
  const merged: ScrapedJob[] = [];
  for (const r of results) {
    for (const j of r.jobs) {
      const key = dedupeKey(j);
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push(j);
    }
  }

  // Light ranking: postedAt desc > presence of salary > has description.
  merged.sort((a, b) => {
    const t = (b.postedAt ?? 0) - (a.postedAt ?? 0);
    if (t !== 0) return t;
    const s = (b.salary ? 1 : 0) - (a.salary ? 1 : 0);
    if (s !== 0) return s;
    return (b.description?.length ?? 0) - (a.description?.length ?? 0);
  });

  const trimmed = merged.slice(0, limit);

  const byProvider = results.map((r) => {
    const p = ALL_PROVIDERS.find((x) => x.id === r.provider);
    return {
      provider: r.provider,
      count: r.jobs.length,
      configured: p?.isConfigured() ?? false,
      error: r.error,
    };
  });

  let note: string | undefined;
  if (trimmed.length === 0) {
    const hasAnyConfig = byProvider.some((b) => b.configured);
    note = hasAnyConfig
      ? "No matches found. Try a broader keyword or a different location."
      : "No job providers are configured yet. Add ADZUNA_APP_ID, USAJOBS_API_KEY, or APIFY_ACTOR_JOB_SCRAPER to enable live results.";
  }

  return { jobs: trimmed, byProvider, note };
}

function dedupeKey(j: ScrapedJob): string {
  if (j.applyUrl) {
    // Strip query strings; many boards re-encode the same URL with
    // different tracking params.
    return j.applyUrl.toLowerCase().split("?")[0];
  }
  return `${j.title.toLowerCase()}|${j.company.toLowerCase()}`;
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
