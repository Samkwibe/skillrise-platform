/**
 * Apify API client — thin wrapper around the "run actor and wait" endpoint.
 *
 * Why `run-sync-get-dataset-items`?
 *   Apify gives us three ways to invoke an actor: async (get a run id
 *   back and poll), sync (block until it finishes and get the run body),
 *   and sync-get-dataset-items (block + directly return dataset rows).
 *   For one-off lookups during a request (media extract, job search,
 *   content analysis) the third option is the simplest: a single HTTP
 *   call returns the structured result. For long-running batch work
 *   (transcripts, RAG crawl) callers can still use `runActorAsync`
 *   + `getRunDatasetItems` below.
 *
 * Env:
 *   APIFY_API_TOKEN   Required for any call. Missing => `isApifyEnabled()` is false.
 *   APIFY_ACTOR_*     Actor IDs per feature (see .env.local).
 */
const API = "https://api.apify.com/v2";

export function isApifyEnabled(): boolean {
  return Boolean(process.env.APIFY_API_TOKEN);
}

function token(): string {
  const t = process.env.APIFY_API_TOKEN;
  if (!t) throw new Error("APIFY_API_TOKEN missing.");
  return t;
}

function actorPath(actorId: string): string {
  // Actor IDs come in either "username/actor" or "username~actor" shape.
  // The Apify REST API uses the tilde form in the path.
  return encodeURIComponent(actorId.replace("/", "~"));
}

export type RunActorOpts = {
  /** Default 45s. Raise for actors that need more work. Max enforced by Apify is ~300s sync. */
  timeoutSec?: number;
  /** Keep responses small when we only need the first N rows. */
  limit?: number;
  /** Optional memory allocation (MB). Most actors default to 1024. */
  memoryMbytes?: number;
};

export type RunActorResult<T> = {
  ok: boolean;
  rows: T[] | null;
  status?: number;
  error?: string;
};

/**
 * Run an Apify actor and wait synchronously for its dataset rows.
 * Never throws — the tiered search layer needs a graceful degrade path.
 * Returns a small envelope so callers can distinguish "actor ran, returned
 * nothing" from "actor failed to start" (wrong id, auth, quota).
 */
export async function runActorSync<T = unknown>(
  actorId: string,
  input: unknown,
  opts: RunActorOpts = {},
): Promise<RunActorResult<T>> {
  if (!isApifyEnabled()) {
    return { ok: false, rows: null, error: "APIFY_API_TOKEN missing" };
  }

  const timeoutSec = opts.timeoutSec ?? 45;
  const limit = opts.limit ?? 20;

  const params = new URLSearchParams({
    token: token(),
    timeout: String(timeoutSec),
    limit: String(limit),
    format: "json",
    clean: "true",
  });
  if (opts.memoryMbytes) params.set("memory", String(opts.memoryMbytes));

  const url = `${API}/acts/${actorPath(actorId)}/run-sync-get-dataset-items?${params.toString()}`;

  // AbortController safety net — the Apify timeout is a soft cap; we want
  // to hang up ourselves after timeoutSec + a small grace period.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), (timeoutSec + 5) * 1000);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input ?? {}),
      signal: controller.signal,
      cache: "no-store",
    });
    if (!res.ok) {
      // Read a small slice of the body to aid debugging (actor-not-found,
      // auth-failed, quota-exceeded all return informative JSON).
      let detail = "";
      try {
        const text = await res.text();
        detail = text.slice(0, 240);
      } catch {
        // ignore
      }
      return {
        ok: false,
        rows: null,
        status: res.status,
        error: `Apify HTTP ${res.status}: ${detail || res.statusText}`,
      };
    }
    const data = (await res.json()) as unknown;
    const rows = Array.isArray(data) ? (data as T[]) : null;
    return { ok: true, rows, status: 200 };
  } catch (e) {
    return { ok: false, rows: null, error: (e as Error).message };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Fire-and-forget variant for background jobs (transcripts, etc).
 * Returns the runId so a downstream job can poll for completion later.
 * We never block the user on this.
 */
export async function runActorAsync(
  actorId: string,
  input: unknown,
): Promise<{ id: string; status: string } | null> {
  if (!isApifyEnabled()) return null;
  const url = `${API}/acts/${actorPath(actorId)}/runs?token=${token()}`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input ?? {}),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const body = (await res.json()) as { data?: { id?: string; status?: string } };
    if (!body?.data?.id) return null;
    return { id: body.data.id, status: body.data.status ?? "UNKNOWN" };
  } catch {
    return null;
  }
}

/**
 * Poll a previously-started run for dataset items. Use with `runActorAsync`.
 */
export async function getRunDatasetItems<T = unknown>(
  runId: string,
  limit = 50,
): Promise<T[] | null> {
  if (!isApifyEnabled()) return null;
  const url = `${API}/actor-runs/${encodeURIComponent(runId)}/dataset/items?token=${token()}&format=json&limit=${limit}`;
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    const data = (await res.json()) as unknown;
    return Array.isArray(data) ? (data as T[]) : null;
  } catch {
    return null;
  }
}

/**
 * Default actor IDs — overridable via env so you can swap to a fork
 * without redeploying code.
 */
export const ACTORS = {
  mediaExtractor:
    process.env.APIFY_ACTOR_MEDIA_EXTRACTOR || "abotapi~universal-media-extractor",
  jobScraper:
    process.env.APIFY_ACTOR_JOB_SCRAPER || "potent_xenoblast~linkedin-indeed-scraper",
  googleJobs:
    process.env.APIFY_ACTOR_GOOGLE_JOBS || "orgupdate~google-jobs-scraper",
  contentProcessor:
    process.env.APIFY_ACTOR_CONTENT_PROCESSOR || "valid_headlamp~ai-content-processor",
  videoTranscript:
    process.env.APIFY_ACTOR_VIDEO_TRANSCRIPT || "thepattyroller~elite-video-processing-lite",
  ragBrowser: process.env.APIFY_ACTOR_RAG_BROWSER || "apify~rag-web-browser",
} as const;
