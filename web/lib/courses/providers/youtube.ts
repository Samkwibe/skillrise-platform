import type { FreeCourse } from "../types";
import { stableCourseId } from "../ids";

const SEARCH = "https://www.googleapis.com/youtube/v3/search";
const VIDEOS = "https://www.googleapis.com/youtube/v3/videos";

/**
 * Educational YouTube videos (and a few top playlists) for unified course search.
 * Uses the same YOUTUBE_API_KEY as the rest of SkillRise.
 */
export async function searchYouTubeEducational(query: string, limit: number): Promise<FreeCourse[]> {
  const key = process.env.YOUTUBE_API_KEY?.trim();
  if (!key) return [];

  const q = `${query} (tutorial OR course OR lesson OR full course)`.trim();
  const sp = new URLSearchParams({
    part: "snippet",
    type: "video",
    maxResults: String(Math.min(Math.max(limit, 1), 15)),
    q,
    key,
    safeSearch: "strict",
    relevanceLanguage: "en",
    videoEmbeddable: "true",
  });

  try {
    const res = await fetch(`${SEARCH}?${sp}`, { cache: "no-store" });
    if (!res.ok) {
      const errBody = await res.text();
      // eslint-disable-next-line no-console
      console.error(
        "[courses/youtube] search failed HTTP %s — %s",
        res.status,
        errBody.slice(0, 400),
      );
      return [];
    }
    const data = (await res.json()) as {
      items?: Array<{
        id?: { videoId?: string };
        snippet?: { title?: string; description?: string; channelTitle?: string; thumbnails?: { high?: { url?: string } } };
      }>;
    };
    const items = data.items ?? [];
    const ids = items.map((i) => i.id?.videoId).filter((x): x is string => Boolean(x));
    if (ids.length === 0) return [];

    const stats = await fetch(
      `${VIDEOS}?${new URLSearchParams({
        part: "statistics,contentDetails,snippet",
        id: ids.join(","),
        key,
      })}`,
      { cache: "no-store" },
    );
    const vd = stats.ok
      ? ((await stats.json()) as {
          items?: Array<{
            id?: string;
            statistics?: { viewCount?: string; likeCount?: string };
            contentDetails?: { duration?: string };
            snippet?: { title?: string; description?: string; channelTitle?: string };
          }>;
        })
      : { items: [] };
    const byId = new Map(vd.items?.map((v) => [v.id, v]) ?? []);

    const out: FreeCourse[] = [];
    for (const i of items) {
      const vid = i.id?.videoId;
      if (!vid) continue;
      const url = `https://www.youtube.com/watch?v=${vid}`;
      const ex = byId.get(vid);
      const views = ex?.statistics?.viewCount ? Number(ex.statistics.viewCount) : undefined;
      const title = ex?.snippet?.title || i.snippet?.title || "YouTube video";
      const desc = (ex?.snippet?.description || i.snippet?.description || "").replace(/\s+/g, " ").trim().slice(0, 280);
      const channel = ex?.snippet?.channelTitle || i.snippet?.channelTitle || "YouTube";
      const dur = ex?.contentDetails?.duration
        ? formatIsoDuration(ex.contentDetails.duration)
        : undefined;
      out.push({
        id: stableCourseId("youtube", url),
        provider: "youtube",
        title,
        description: desc,
        url,
        imageUrl: i.snippet?.thumbnails?.high?.url,
        byline: channel,
        format: "YouTube (free)",
        durationText: dur,
        viewCount: views,
        ratingCountLabel: views ? formatViews(views) + " views" : undefined,
        youtubeVideoId: vid,
      });
      if (out.length >= limit) break;
    }
    return out;
  } catch {
    return [];
  }
}

function formatViews(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function formatIsoDuration(iso: string): string {
  const m = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(iso || "");
  if (!m) return "—";
  const h = Number(m[1] || 0);
  const mm = Number(m[2] || 0);
  const s = Number(m[3] || 0);
  if (h) return `${h}:${String(mm).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${mm}:${String(s).padStart(2, "0")}`;
}
