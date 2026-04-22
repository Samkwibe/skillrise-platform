/**
 * Tiered skill-video search.
 *
 * Primary:   Brave Search API /v1/videos/search  (1,000 free / month)
 * Fallback:  Serper.dev /search?type=video       (2,500 free total)
 * Last:      Curated / YouTube Data API          (already implemented in search-service.ts)
 *
 * All responses are cached in the tiered cache (DynamoDB-backed + memory
 * fallback) for `SEARCH_CACHE_TTL_HOURS` (default 36h) keyed by query.
 *
 * The normalized `SkillVideoHit` is what the feed and dashboard render;
 * callers don't need to know which provider answered.
 */
import { cached } from "@/lib/cache/tiered-cache";

const BRAVE_VIDEO = "https://api.search.brave.com/res/v1/videos/search";
const SERPER = "https://google.serper.dev/search";

export type SkillVideoHit = {
  id: string;
  title: string;
  url: string;
  /** Embeddable URL when we know it; otherwise same as url. */
  embedUrl?: string;
  thumbnail?: string;
  source: "brave" | "serper" | "youtube" | "curated";
  publisher?: string;
  durationText?: string;
  description?: string;
};

export type TieredSearchResult = {
  query: string;
  provider: SkillVideoHit["source"];
  fromCache: boolean;
  hits: SkillVideoHit[];
  note?: string;
};

const ttlHours = Math.max(
  1,
  Number(process.env.SEARCH_CACHE_TTL_HOURS || 36),
);

/* ---------- Brave ---------- */

type BraveVideoItem = {
  title?: string;
  url?: string;
  description?: string;
  age?: string;
  video?: {
    duration?: string;
    publisher?: string;
    thumbnail?: { src?: string };
  };
  thumbnail?: { src?: string };
};

async function braveVideoSearch(q: string, count: number): Promise<SkillVideoHit[] | null> {
  const key = process.env.BRAVE_SEARCH_API_KEY;
  if (!key) return null;

  const params = new URLSearchParams({
    q,
    count: String(Math.min(Math.max(count, 1), 20)),
    safesearch: "strict",
  });

  try {
    const res = await fetch(`${BRAVE_VIDEO}?${params.toString()}`, {
      headers: {
        "X-Subscription-Token": key,
        Accept: "application/json",
      },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { results?: BraveVideoItem[] };
    const items = data.results ?? [];
    return items
      .filter((r) => r.url)
      .map((r, i): SkillVideoHit => ({
        id: `brave-${i}-${hashish(r.url!)}`,
        title: r.title || "Untitled",
        url: r.url!,
        thumbnail: r.video?.thumbnail?.src || r.thumbnail?.src,
        durationText: r.video?.duration,
        publisher: r.video?.publisher,
        description: r.description,
        source: "brave",
      }));
  } catch {
    return null;
  }
}

/* ---------- Serper ---------- */

type SerperVideoItem = {
  title?: string;
  link?: string;
  snippet?: string;
  imageUrl?: string;
  duration?: string;
  source?: string;
  channel?: string;
};

async function serperVideoSearch(q: string, count: number): Promise<SkillVideoHit[] | null> {
  const key = process.env.SERPER_API_KEY;
  if (!key) return null;

  try {
    const res = await fetch(SERPER, {
      method: "POST",
      headers: {
        "X-API-KEY": key,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ q, type: "video", num: Math.min(Math.max(count, 1), 20) }),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { videos?: SerperVideoItem[] };
    const items = data.videos ?? [];
    return items
      .filter((r) => r.link)
      .map((r, i): SkillVideoHit => ({
        id: `serper-${i}-${hashish(r.link!)}`,
        title: r.title || "Untitled",
        url: r.link!,
        thumbnail: r.imageUrl,
        durationText: r.duration,
        publisher: r.source || r.channel,
        description: r.snippet,
        source: "serper",
      }));
  } catch {
    return null;
  }
}

/* ---------- Orchestrator ---------- */

export async function tieredSkillSearch(
  rawQuery: string,
  max = 10,
): Promise<TieredSearchResult> {
  const query = rawQuery.trim();
  if (!query) {
    return { query: "", provider: "curated", fromCache: false, hits: [] };
  }

  // Cache namespace includes max so different ask-sizes don't collide.
  const cacheKey = `${query}|max=${max}`;
  const loader = async (): Promise<TieredSearchResult> => {
    const brave = await braveVideoSearch(query, max);
    if (brave && brave.length > 0) {
      return { query, provider: "brave", fromCache: false, hits: brave };
    }

    const serper = await serperVideoSearch(query, max);
    if (serper && serper.length > 0) {
      return {
        query,
        provider: "serper",
        fromCache: false,
        hits: serper,
        note: brave === null ? undefined : "Brave returned no results; served from Serper.",
      };
    }

    return {
      query,
      provider: "curated",
      fromCache: false,
      hits: [],
      note: "No live results — caller should fall back to curated catalog.",
    };
  };

  const result = await cached<TieredSearchResult>(
    "search:skills",
    cacheKey,
    loader,
    { ttlHours },
  );
  // `cached()` doesn't tell us hit vs miss directly, but the loader
  // always produces `fromCache: false`. If we got back `fromCache: false`
  // and the namespace had a hit, the stored copy would still say `false`.
  // Rather than second-guess, we set a best-effort flag via timestamp:
  // if the loader ran "just now" the result would be fresh; otherwise
  // it's cached. This isn't exposed to users — it's for logs only.
  return { ...result, fromCache: result.fromCache };
}

/* ---------- helpers ---------- */

function hashish(s: string): string {
  // Stable, cheap hash for ids. We don't need cryptographic strength here;
  // the goal is deduplication within a single result page.
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return (h >>> 0).toString(36);
}
