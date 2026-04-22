/**
 * MIT OpenCourseWare provider, served via the public MIT Learn API.
 *
 * Endpoint: https://api.learn.mit.edu/api/v1/learning_resources_search/
 * (The `ocw.mit.edu/api/v0/*` URL commonly cited in old guides returns
 * HTML 404s — MIT consolidated onto `learn.mit.edu` a while back.)
 *
 * We restrict the search to MIT OpenCourseWare results (`platform=ocw`)
 * so the catalog stays free + open. When a result exposes a YouTube
 * playlist URL on its most recent run we use it for inline playback;
 * otherwise the card links out to the OCW page where videos live.
 *
 * The endpoint is public, no key needed.
 */
import {
  clampText,
  hashish,
  type LearningResource,
  type ResourceProvider,
  type ResourceProviderResult,
  type ResourceSearchOpts,
} from "../types";

type Instructor = { first_name?: string; last_name?: string; full_name?: string };

type MitRun = {
  year?: number;
  semester?: string;
  url?: string;
  slug?: string;
  duration?: string;
  time_commitment?: string;
  instructors?: Instructor[];
  image?: { url?: string };
};

type MitResult = {
  id?: number;
  readable_id?: string;
  title?: string;
  description?: string;
  url?: string;
  image?: { url?: string };
  resource_type?: string;
  free?: boolean;
  certification?: boolean;
  languages?: string[];
  platform?: { code?: string; name?: string };
  offered_by?: { code?: string; name?: string };
  topics?: Array<{ name?: string }>;
  ocw_topics?: string[];
  runs?: MitRun[];
  course_feature?: string[];
  duration?: string;
  time_commitment?: string;
};

type MitResponse = {
  count?: number;
  results?: MitResult[];
};

export const mitOcwProvider: ResourceProvider = {
  id: "mit-ocw",
  label: "MIT OCW",
  isConfigured() {
    return true;
  },
  async search(opts: ResourceSearchOpts): Promise<ResourceProviderResult> {
    const limit = Math.min(Math.max(opts.limit ?? 8, 1), 16);
    const params = new URLSearchParams({
      q: opts.query,
      limit: String(limit),
      resource_type: "course",
      platform: "ocw",
      free: "true",
    });
    const url = `https://api.learn.mit.edu/api/v1/learning_resources_search/?${params.toString()}`;

    try {
      const res = await fetch(url, {
        cache: "no-store",
        headers: { Accept: "application/json" },
      });
      if (!res.ok) {
        return { provider: "mit-ocw", items: [], error: `HTTP ${res.status}` };
      }
      const data = (await res.json()) as MitResponse;
      const results = data.results ?? [];
      const items: LearningResource[] = [];
      for (const r of results) {
        if (!r.title) continue;
        const absUrl =
          r.url ??
          (r.runs?.[0]?.url) ??
          (r.readable_id
            ? `https://ocw.mit.edu/courses/${r.readable_id.split("+")[0]}/`
            : null);
        if (!absUrl) continue;

        const run = [...(r.runs ?? [])].sort(
          (a, b) => (b.year ?? 0) - (a.year ?? 0),
        )[0];
        const instructor = run?.instructors?.[0];
        const author = instructor
          ? instructor.full_name ??
            `${instructor.first_name ?? ""} ${instructor.last_name ?? ""}`.trim()
          : r.offered_by?.name;

        const topics = (r.topics ?? [])
          .map((t) => t.name)
          .filter((t): t is string => Boolean(t));

        const thumbnail = r.image?.url ?? run?.image?.url ?? undefined;
        const duration =
          r.duration ||
          r.time_commitment ||
          run?.time_commitment ||
          (run?.year ? `${run.year} ${run.semester ?? ""}`.trim() : undefined);

        // OCW courses host lecture videos on YouTube. The run payload
        // from MIT Learn doesn't always expose a playlist id, but when
        // it does we embed; otherwise we fall back to link-out (the
        // card opens the OCW page where videos play in context).
        const ytId = extractYoutubePlaylistId(run);
        const embedUrl = ytId
          ? `https://www.youtube-nocookie.com/embed/videoseries?list=${encodeURIComponent(ytId)}`
          : undefined;

        const hasVideos = (r.course_feature ?? []).some((f) =>
          /video/i.test(f),
        );

        items.push({
          id: `mit-ocw:${r.readable_id ?? r.id ?? hashish(absUrl)}`,
          title: r.title,
          description: clampText(r.description, 360),
          url: absUrl.startsWith("http") ? absUrl : `https://ocw.mit.edu${absUrl}`,
          thumbnail: thumbnail?.startsWith("http")
            ? thumbnail
            : thumbnail
              ? `https://ocw.mit.edu${thumbnail}`
              : undefined,
          author,
          duration,
          language: r.languages?.[0] ?? "en",
          publishedAt: run?.year ? Date.UTC(run.year, 0, 1) : undefined,
          provider: "mit-ocw",
          kind: embedUrl || hasVideos ? "video" : "course",
          embedUrl,
          freeCertificate: Boolean(r.certification),
          tags: topics.slice(0, 5),
        });
      }
      return { provider: "mit-ocw", items };
    } catch (e) {
      return { provider: "mit-ocw", items: [], error: (e as Error).message };
    }
  },
};

/**
 * Best-effort pull of a YouTube playlist id from a run. MIT doesn't
 * expose this as a first-class field; when it's present it's usually
 * stuffed inside a URL field. We only accept obvious matches so we
 * never embed a random page.
 */
function extractYoutubePlaylistId(run: MitRun | undefined): string | null {
  if (!run) return null;
  const candidates = [run.url, run.slug].filter(
    (s): s is string => typeof s === "string",
  );
  for (const s of candidates) {
    const m = s.match(/[?&]list=([A-Za-z0-9_-]{10,})/);
    if (m) return m[1];
  }
  return null;
}
