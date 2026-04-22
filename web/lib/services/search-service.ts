/**
 * Free-video skill search.
 *
 * Given a skill/topic query, return a list of free videos the learner can watch
 * right now — pulled from YouTube via the Data API v3 when a key is configured,
 * or a curated fallback catalog of real educational channels otherwise.
 *
 * Env:
 *   YOUTUBE_API_KEY  Optional. If set, we query YouTube Data API v3 directly.
 */

export type SearchVideo = {
  id: string;
  title: string;
  channel: string;
  thumbnail: string;
  url: string;
  embedUrl: string;
  durationText: string;
  publishedAt?: string;
  views?: number;
  source: "youtube" | "curated";
};

export type SearchResult = {
  provider: "youtube" | "curated";
  query: string;
  videos: SearchVideo[];
  note?: string;
};

const YT_SEARCH = "https://www.googleapis.com/youtube/v3/search";
const YT_VIDEOS = "https://www.googleapis.com/youtube/v3/videos";

/** Parse an ISO 8601 duration like "PT1H5M12S" into "1:05:12". */
function formatIsoDuration(iso: string): string {
  const m = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(iso || "");
  if (!m) return "—";
  const h = Number(m[1] || 0);
  const mm = Number(m[2] || 0);
  const ss = Number(m[3] || 0);
  if (h > 0) return `${h}:${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
  return `${mm}:${String(ss).padStart(2, "0")}`;
}

function ytThumb(id: string): string {
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}

function ytEmbed(id: string): string {
  return `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1`;
}

function ytWatch(id: string): string {
  return `https://www.youtube.com/watch?v=${id}`;
}

async function searchYouTube(q: string, max: number): Promise<SearchVideo[]> {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) return [];

  const params = new URLSearchParams({
    part: "snippet",
    q,
    type: "video",
    videoEmbeddable: "true",
    safeSearch: "strict",
    maxResults: String(Math.min(Math.max(max, 1), 20)),
    key,
  });

  const res = await fetch(`${YT_SEARCH}?${params.toString()}`, { cache: "no-store" });
  if (!res.ok) return [];
  const data = (await res.json()) as {
    items?: Array<{
      id?: { videoId?: string };
      snippet?: {
        title?: string;
        channelTitle?: string;
        publishedAt?: string;
        thumbnails?: { high?: { url?: string }; medium?: { url?: string } };
      };
    }>;
  };

  const items = (data.items ?? []).filter((i) => i.id?.videoId);
  const ids = items.map((i) => i.id!.videoId!).filter(Boolean);
  if (ids.length === 0) return [];

  // Second call for durations & view counts
  const vParams = new URLSearchParams({
    part: "contentDetails,statistics",
    id: ids.join(","),
    key,
  });
  const vRes = await fetch(`${YT_VIDEOS}?${vParams.toString()}`, { cache: "no-store" });
  const vData = vRes.ok
    ? ((await vRes.json()) as {
        items?: Array<{
          id?: string;
          contentDetails?: { duration?: string };
          statistics?: { viewCount?: string };
        }>;
      })
    : { items: [] };

  const meta = new Map<string, { duration: string; views: number }>();
  for (const it of vData.items ?? []) {
    if (!it.id) continue;
    meta.set(it.id, {
      duration: it.contentDetails?.duration ?? "",
      views: Number(it.statistics?.viewCount ?? 0),
    });
  }

  return items.map((i): SearchVideo => {
    const id = i.id!.videoId!;
    const m = meta.get(id);
    return {
      id,
      title: i.snippet?.title ?? "Untitled",
      channel: i.snippet?.channelTitle ?? "Unknown channel",
      thumbnail:
        i.snippet?.thumbnails?.high?.url ||
        i.snippet?.thumbnails?.medium?.url ||
        ytThumb(id),
      url: ytWatch(id),
      embedUrl: ytEmbed(id),
      durationText: m?.duration ? formatIsoDuration(m.duration) : "Video",
      publishedAt: i.snippet?.publishedAt,
      views: m?.views,
      source: "youtube",
    };
  });
}

/* ---------- Curated fallback ----------
 * Real, well-known free educational content. Each entry maps keywords →
 * a pool of channels + starter videos. When no YOUTUBE_API_KEY is set we
 * still give the learner high-signal starting points instead of empty state.
 */

type CuratedEntry = {
  keywords: string[];
  videos: Array<Omit<SearchVideo, "source">>;
};

const CURATED: CuratedEntry[] = [
  {
    keywords: ["electrical", "electrician", "circuit", "wiring", "outlet", "breaker"],
    videos: [
      {
        id: "electrician-u-basics",
        title: "Electrical Theory for Beginners",
        channel: "Electrician U",
        thumbnail: ytThumb("Rx8lxBr_iB8"),
        url: "https://www.youtube.com/@ElectricianU",
        embedUrl: ytEmbed("Rx8lxBr_iB8"),
        durationText: "Channel",
      },
      {
        id: "this-old-house-electrical",
        title: "How to Wire an Outlet",
        channel: "This Old House",
        thumbnail: ytThumb("k8rWrmKPplo"),
        url: "https://www.youtube.com/@thisoldhouse",
        embedUrl: ytEmbed("k8rWrmKPplo"),
        durationText: "Channel",
      },
    ],
  },
  {
    keywords: ["python", "programming", "code", "coding"],
    videos: [
      {
        id: "fcc-python-full",
        title: "Learn Python — Full Course for Beginners",
        channel: "freeCodeCamp.org",
        thumbnail: ytThumb("rfscVS0vtbw"),
        url: ytWatch("rfscVS0vtbw"),
        embedUrl: ytEmbed("rfscVS0vtbw"),
        durationText: "4:26:51",
      },
      {
        id: "corey-schafer-python",
        title: "Python Tutorials",
        channel: "Corey Schafer",
        thumbnail: ytThumb("YYXdXT2l-Gg"),
        url: "https://www.youtube.com/@coreyms",
        embedUrl: ytEmbed("YYXdXT2l-Gg"),
        durationText: "Playlist",
      },
    ],
  },
  {
    keywords: ["javascript", "js", "web", "html", "css", "frontend"],
    videos: [
      {
        id: "fcc-js-full",
        title: "JavaScript Programming — Full Course",
        channel: "freeCodeCamp.org",
        thumbnail: ytThumb("jS4aFq5-91M"),
        url: ytWatch("jS4aFq5-91M"),
        embedUrl: ytEmbed("jS4aFq5-91M"),
        durationText: "7:44:00",
      },
      {
        id: "kevin-powell",
        title: "Modern CSS that works everywhere",
        channel: "Kevin Powell",
        thumbnail: ytThumb("srvUrASNj0s"),
        url: "https://www.youtube.com/@KevinPowell",
        embedUrl: ytEmbed("srvUrASNj0s"),
        durationText: "Channel",
      },
    ],
  },
  {
    keywords: ["money", "budget", "finance", "financial", "personal finance", "save", "invest"],
    videos: [
      {
        id: "financial-diet-intro",
        title: "How to Build a Budget That Works",
        channel: "The Financial Diet",
        thumbnail: ytThumb("HQzoZfc3GwQ"),
        url: "https://www.youtube.com/@thefinancialdiet",
        embedUrl: ytEmbed("HQzoZfc3GwQ"),
        durationText: "Channel",
      },
      {
        id: "tiffany-budgetnista",
        title: "Personal Finance Basics",
        channel: "The Budgetnista",
        thumbnail: ytThumb("Kxo6JAn7F6o"),
        url: "https://www.youtube.com/@thebudgetnista",
        embedUrl: ytEmbed("Kxo6JAn7F6o"),
        durationText: "Channel",
      },
    ],
  },
  {
    keywords: ["math", "algebra", "geometry", "calculus", "arithmetic"],
    videos: [
      {
        id: "khan-math",
        title: "Math on Khan Academy",
        channel: "Khan Academy",
        thumbnail: ytThumb("yUpDRpkUhf4"),
        url: "https://www.youtube.com/@khanacademy",
        embedUrl: ytEmbed("yUpDRpkUhf4"),
        durationText: "Channel",
      },
      {
        id: "3b1b-linalg",
        title: "Essence of Linear Algebra",
        channel: "3Blue1Brown",
        thumbnail: ytThumb("fNk_zzaMoSs"),
        url: ytWatch("fNk_zzaMoSs"),
        embedUrl: ytEmbed("fNk_zzaMoSs"),
        durationText: "Playlist",
      },
    ],
  },
  {
    keywords: ["speaking", "communication", "interview", "presentation"],
    videos: [
      {
        id: "charisma-on-command",
        title: "How To Speak So People Listen",
        channel: "Charisma on Command",
        thumbnail: ytThumb("Unzc731iCUY"),
        url: "https://www.youtube.com/@CharismaonCommand",
        embedUrl: ytEmbed("Unzc731iCUY"),
        durationText: "Channel",
      },
      {
        id: "linda-raynier",
        title: "Ace Your Next Job Interview",
        channel: "Linda Raynier",
        thumbnail: ytThumb("HG68Ymazo18"),
        url: "https://www.youtube.com/@LindaRaynier",
        embedUrl: ytEmbed("HG68Ymazo18"),
        durationText: "Channel",
      },
    ],
  },
  {
    keywords: ["plumbing", "plumber", "pipe", "drain"],
    videos: [
      {
        id: "roger-wakefield",
        title: "Plumbing 101 — the basics",
        channel: "Roger Wakefield",
        thumbnail: ytThumb("o9jD0Vnv-4E"),
        url: "https://www.youtube.com/@RogerWakefield",
        embedUrl: ytEmbed("o9jD0Vnv-4E"),
        durationText: "Channel",
      },
    ],
  },
  {
    keywords: ["design", "ux", "ui", "figma"],
    videos: [
      {
        id: "designcourse",
        title: "UI/UX Design Fundamentals",
        channel: "DesignCourse",
        thumbnail: ytThumb("c9Wg6Cb_YlU"),
        url: "https://www.youtube.com/@DesignCourse",
        embedUrl: ytEmbed("c9Wg6Cb_YlU"),
        durationText: "Channel",
      },
      {
        id: "the-futur",
        title: "Designing a career you love",
        channel: "The Futur",
        thumbnail: ytThumb("m8ynOB4CcAs"),
        url: "https://www.youtube.com/@thefutur",
        embedUrl: ytEmbed("m8ynOB4CcAs"),
        durationText: "Channel",
      },
    ],
  },
  {
    keywords: ["resume", "cv", "job", "career"],
    videos: [
      {
        id: "self-made-millennial",
        title: "Write a resume that gets interviews",
        channel: "Self Made Millennial",
        thumbnail: ytThumb("Tt08KmFfIYQ"),
        url: "https://www.youtube.com/@SelfMadeMillennial",
        embedUrl: ytEmbed("Tt08KmFfIYQ"),
        durationText: "Channel",
      },
    ],
  },
  {
    keywords: ["ai", "machine learning", "ml", "artificial intelligence"],
    videos: [
      {
        id: "fcc-ml",
        title: "Machine Learning for Everybody — Full Course",
        channel: "freeCodeCamp.org",
        thumbnail: ytThumb("i_LwzRVP7bg"),
        url: ytWatch("i_LwzRVP7bg"),
        embedUrl: ytEmbed("i_LwzRVP7bg"),
        durationText: "3:53:53",
      },
    ],
  },
];

const DEFAULT_POOL: Array<Omit<SearchVideo, "source">> = [
  {
    id: "fcc-home",
    title: "freeCodeCamp.org — free coding courses",
    channel: "freeCodeCamp.org",
    thumbnail: ytThumb("8hly31xKli0"),
    url: "https://www.youtube.com/@freecodecamp",
    embedUrl: ytEmbed("8hly31xKli0"),
    durationText: "Channel",
  },
  {
    id: "khan-home",
    title: "Khan Academy — free world-class education",
    channel: "Khan Academy",
    thumbnail: ytThumb("2ZhQkD1QKFw"),
    url: "https://www.youtube.com/@khanacademy",
    embedUrl: ytEmbed("2ZhQkD1QKFw"),
    durationText: "Channel",
  },
  {
    id: "ted-ed",
    title: "TED-Ed — lessons worth sharing",
    channel: "TED-Ed",
    thumbnail: ytThumb("EYnZ8fM4f9s"),
    url: "https://www.youtube.com/@TEDEd",
    embedUrl: ytEmbed("EYnZ8fM4f9s"),
    durationText: "Channel",
  },
];

function curatedSearch(q: string, max: number): SearchVideo[] {
  const needle = q.toLowerCase().trim();
  const hits: Array<Omit<SearchVideo, "source">> = [];

  for (const entry of CURATED) {
    if (entry.keywords.some((k) => needle.includes(k))) {
      hits.push(...entry.videos);
    }
  }

  // Always append a direct YouTube search pivot so the learner can jump to live results
  const searchPivot: Omit<SearchVideo, "source"> = {
    id: `yt-search-${encodeURIComponent(needle).slice(0, 12)}`,
    title: `Search YouTube for "${q}"`,
    channel: "YouTube",
    thumbnail: "https://www.youtube.com/s/desktop/c0eadd7b/img/favicon_144x144.png",
    url: `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}+free+course`,
    embedUrl: "",
    durationText: "Live search",
  };

  const out = hits.length > 0 ? hits : DEFAULT_POOL;
  return [searchPivot, ...out].slice(0, max).map((v) => ({ ...v, source: "curated" as const }));
}

/**
 * Tiered skill-video search:
 *   1. Brave Search API (/v1/videos/search)  — 1,000 free/month
 *   2. Serper.dev (/search?type=video)        — 2,500 free total
 *   3. YouTube Data API v3                    — legacy, still useful
 *   4. Curated catalog                        — always-present fallback
 *
 * Results from (1) and (2) are normalized into our SearchVideo shape and
 * deduped by URL. All three live-providers are cached in DynamoDB for
 * SEARCH_CACHE_TTL_HOURS (default 36h), so a hot topic only hits their
 * free tiers once.
 */
export async function searchFreeVideos(q: string, max = 12): Promise<SearchResult> {
  const query = q.trim();
  if (!query) return { provider: "curated", query, videos: [] };

  // Imports are inline to avoid loading AWS/Apify SDK chains on pages
  // that never call into this function.
  const { tieredSkillSearch } = await import("@/lib/search/tiered");
  const tiered = await tieredSkillSearch(query, max);

  const fromTiered: SearchVideo[] = tiered.hits.map((h): SearchVideo => ({
    id: h.id,
    title: h.title,
    channel: h.publisher || "Open web",
    thumbnail: h.thumbnail || "",
    url: h.url,
    embedUrl: toEmbed(h.url) || "",
    durationText: h.durationText || "Video",
    source: h.source === "brave" || h.source === "serper" ? "youtube" : "curated",
  }));

  // Supplement with direct YouTube results (if key + missing thumbnails/durations benefit from it)
  let ytVideos: SearchVideo[] = [];
  if (process.env.YOUTUBE_API_KEY) {
    try {
      ytVideos = await searchYouTube(query, max);
    } catch {
      // swallow
    }
  }

  // Dedupe by URL; prefer tiered (it reflects fresh web results), fall
  // back to YT for anything not already present.
  const seen = new Set<string>();
  const merged: SearchVideo[] = [];
  for (const v of [...fromTiered, ...ytVideos]) {
    const key = v.url;
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(v);
    if (merged.length >= max) break;
  }

  if (merged.length > 0) {
    return {
      provider: tiered.hits.length > 0 ? "youtube" : "youtube",
      query,
      videos: merged,
      note: tiered.note,
    };
  }

  return {
    provider: "curated",
    query,
    videos: curatedSearch(query, max),
    note:
      process.env.BRAVE_SEARCH_API_KEY || process.env.SERPER_API_KEY || process.env.YOUTUBE_API_KEY
        ? "Live search temporarily unavailable — showing curated starting points."
        : "Curated starting points. Add BRAVE_SEARCH_API_KEY, SERPER_API_KEY, or YOUTUBE_API_KEY to enable live search.",
  };
}

/**
 * Turn a watch-URL from Brave/Serper/YouTube into an embeddable src where
 * we can. Everything else returns "" so the caller knows it can't be
 * inlined and must link out.
 */
function toEmbed(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtube.com")) {
      const id = u.searchParams.get("v");
      if (id) return ytEmbed(id);
      // /shorts/<id> and /embed/<id>
      const m = /\/(shorts|embed)\/([\w-]+)/.exec(u.pathname);
      if (m) return ytEmbed(m[2]);
    }
    if (u.hostname === "youtu.be") {
      const id = u.pathname.replace("/", "");
      if (id) return ytEmbed(id);
    }
    if (u.hostname.includes("vimeo.com")) {
      const id = u.pathname.split("/").filter(Boolean).pop();
      if (id && /^\d+$/.test(id)) return `https://player.vimeo.com/video/${id}`;
    }
  } catch {
    // fall through
  }
  return null;
}

/** Lightweight suggestions used to pre-populate the search bar. */
export const SEARCH_SUGGESTIONS: string[] = [
  "Electrical basics",
  "Python for beginners",
  "Personal finance",
  "Public speaking",
  "JavaScript fundamentals",
  "UI design",
  "Resume & interviews",
  "Plumbing 101",
  "Algebra basics",
  "Machine learning",
];
