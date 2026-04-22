/**
 * YouTube provider — reuses the existing `YOUTUBE_API_KEY` we already
 * have configured for the video-feed. Here we bias the query toward
 * educational content by appending "tutorial OR course OR lesson" and
 * filtering `videoCategoryId=27` (Education) when supported.
 *
 * The player uses `youtube-nocookie.com` for privacy and to respect
 * creators who disable cookie tracking.
 */
import {
  clampText,
  type LearningResource,
  type ResourceProvider,
  type ResourceProviderResult,
  type ResourceSearchOpts,
} from "../types";

type YTSearchResponse = {
  items?: Array<{
    id?: { videoId?: string };
    snippet?: {
      title?: string;
      description?: string;
      channelTitle?: string;
      publishedAt?: string;
      thumbnails?: {
        medium?: { url?: string };
        high?: { url?: string };
      };
    };
  }>;
};

export const youtubeProvider: ResourceProvider = {
  id: "youtube",
  label: "YouTube",
  isConfigured() {
    return Boolean(process.env.YOUTUBE_API_KEY);
  },
  async search(opts: ResourceSearchOpts): Promise<ResourceProviderResult> {
    const key = process.env.YOUTUBE_API_KEY;
    if (!key) {
      return { provider: "youtube", items: [], error: "YOUTUBE_API_KEY missing" };
    }

    const limit = Math.min(Math.max(opts.limit ?? 8, 1), 12);
    const q = `${opts.query} (tutorial OR course OR lesson)`;

    const params = new URLSearchParams({
      part: "snippet",
      q,
      type: "video",
      maxResults: String(limit),
      relevanceLanguage: opts.language ?? "en",
      safeSearch: "strict",
      videoCategoryId: "27",
      key,
    });

    try {
      const res = await fetch(
        `https://www.googleapis.com/youtube/v3/search?${params.toString()}`,
        { cache: "no-store" },
      );
      if (!res.ok) {
        return { provider: "youtube", items: [], error: `HTTP ${res.status}` };
      }
      const data = (await res.json()) as YTSearchResponse;
      const items: LearningResource[] = [];
      for (const it of data.items ?? []) {
        const vid = it.id?.videoId;
        const title = it.snippet?.title;
        if (!vid || !title) continue;
        const thumb =
          it.snippet?.thumbnails?.high?.url ||
          it.snippet?.thumbnails?.medium?.url;
        items.push({
          id: `youtube:${vid}`,
          title,
          description: clampText(it.snippet?.description, 300),
          url: `https://www.youtube.com/watch?v=${vid}`,
          thumbnail: thumb,
          author: it.snippet?.channelTitle,
          language: opts.language ?? "en",
          publishedAt: it.snippet?.publishedAt
            ? Date.parse(it.snippet.publishedAt)
            : undefined,
          provider: "youtube",
          kind: "video",
          embedUrl: `https://www.youtube-nocookie.com/embed/${vid}?rel=0`,
        });
      }
      return { provider: "youtube", items };
    } catch (e) {
      return { provider: "youtube", items: [], error: (e as Error).message };
    }
  },
};
