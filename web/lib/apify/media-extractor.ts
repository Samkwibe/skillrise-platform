/**
 * Universal Media Extractor (Apify: abotapi/universal-media-extractor).
 *
 * Takes a public video URL (YouTube, TikTok, Instagram, Vimeo, X, FB, etc.)
 * and returns a playable direct URL + clean metadata so we can embed it in
 * the feed without relying on each platform's oEmbed/iframe quirks.
 *
 * Used by the tiered search pipeline: Brave/Serper give us raw links; we
 * pass each one through this to get the metadata SkillFeed cards expect.
 */
import { runActorSync, ACTORS } from "./client";
import { cached } from "@/lib/cache/tiered-cache";

export type ExtractedMedia = {
  directUrl: string;
  title?: string;
  thumbnail?: string;
  durationSec?: number;
  durationText?: string;
  platform?: string;
  sourceUrl: string;
};

type RawItem = {
  url?: string;
  direct_url?: string;
  directUrl?: string;
  download_url?: string;
  media_url?: string;
  title?: string;
  thumbnail?: string;
  thumbnail_url?: string;
  duration?: number | string;
  duration_sec?: number;
  platform?: string;
  site?: string;
};

function durationToText(sec: number): string {
  const s = Math.max(0, Math.round(sec));
  const m = Math.floor(s / 60);
  const ss = s % 60;
  if (m >= 60) {
    const h = Math.floor(m / 60);
    const mm = m % 60;
    return `${h}:${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
  }
  return `${m}:${String(ss).padStart(2, "0")}`;
}

export async function extractMedia(url: string): Promise<ExtractedMedia | null> {
  if (!url) return null;

  return cached<ExtractedMedia | null>(
    "apify:extract",
    url,
    async () => {
      const res = await runActorSync<RawItem>(
        ACTORS.mediaExtractor,
        { url, mode: "extract" },
        { timeoutSec: 45, limit: 1 },
      );
      const rows = res.ok ? res.rows : null;
      if (!rows || rows.length === 0) return null;
      const r = rows[0];
      const direct =
        r.direct_url ||
        r.directUrl ||
        r.download_url ||
        r.media_url ||
        r.url ||
        url;
      if (!direct) return null;

      const durSec =
        typeof r.duration_sec === "number"
          ? r.duration_sec
          : typeof r.duration === "number"
            ? r.duration
            : typeof r.duration === "string"
              ? Number(r.duration) || undefined
              : undefined;

      return {
        directUrl: direct,
        title: r.title,
        thumbnail: r.thumbnail || r.thumbnail_url,
        durationSec: durSec,
        durationText: durSec ? durationToText(durSec) : undefined,
        platform: r.platform || r.site,
        sourceUrl: url,
      };
    },
    { ttlHours: 72 },
  );
}

/**
 * Enrich up to `max` results in parallel. Items that fail to extract keep
 * their original URL; we never drop a result just because the extractor
 * couldn't find a direct stream.
 */
export async function extractManyMedia(
  urls: string[],
  max = 10,
): Promise<Map<string, ExtractedMedia>> {
  const slice = urls.slice(0, max);
  const out = new Map<string, ExtractedMedia>();

  // Limited parallelism — the actor isn't cheap to run. 3 at a time feels
  // right for a page-load budget without overwhelming Apify's free tier.
  const limit = 3;
  let i = 0;

  async function worker() {
    while (i < slice.length) {
      const idx = i++;
      const u = slice[idx];
      const m = await extractMedia(u);
      if (m) out.set(u, m);
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, slice.length) }, worker));
  return out;
}
