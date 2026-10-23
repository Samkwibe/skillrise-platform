/**
 * Live LinkedIn and Indeed jobs via Apify actors.
 *
 * Replaces the mock `store.jobs` on the /jobs page for learners who want
 * real-time openings. Results are cached in DynamoDB for
 * `JOBS_CACHE_TTL_HOURS` (default 8h) keyed on `(query|location)`.
 *
 * `APIFY_ACTOR_JOB_SCRAPER` takes one actor id or a comma-separated list.
 * The default runs `johnvc~indeed-jobs-api` and `johnvc~linkedin-jobs-api`
 * in parallel and merges their rows; their inputs and field mappings live in
 * ./job-adapters.ts. (The combined `potent_xenoblast~linkedin-indeed-scraper`
 * used before returns 404 on the Apify API.)
 *
 * Any other actor id still gets the generic path below: we send the common
 * keys and shape the output to our local `ScrapedJob` type, tolerating
 * missing fields. The UI already handles partial data (see
 * app/(app)/jobs/page.tsx).
 */
import { runActorSync, ACTORS } from "./client";
import {
  boardError,
  boardForActor,
  buildBoardInput,
  mapBoardRow,
  parseActorList,
  parseDate,
  type BoardRow,
} from "./job-adapters";
import { cached } from "@/lib/cache/tiered-cache";
import type { ScrapedJob } from "@/lib/jobs/types";

export type { ScrapedJob };

type RawJob = {
  id?: string;
  url?: string;
  link?: string;
  title?: string;
  jobTitle?: string;
  company?: string;
  companyName?: string;
  location?: string;
  locationName?: string;
  description?: string;
  descriptionText?: string;
  salary?: string;
  salaryText?: string;
  employmentType?: string;
  jobType?: string;
  postedAt?: string;
  postedDate?: string;
  source?: string;
};

/**
 * The apify scraper results come from linkedin/indeed — we record the
 * actual origin in the `tags` field and stamp the canonical `source` as
 * "apify" for consistency with the multi-provider architecture.
 */
function inferOrigin(raw: RawJob): string {
  const s = (raw.source || raw.url || raw.link || "").toLowerCase();
  if (s.includes("linkedin")) return "linkedin";
  if (s.includes("indeed")) return "indeed";
  return "other";
}

function normalize(raw: RawJob, i: number): ScrapedJob | null {
  const title = raw.title || raw.jobTitle;
  const company = raw.company || raw.companyName;
  const location = raw.location || raw.locationName;
  if (!title || !company) return null;
  const origin = inferOrigin(raw);
  return {
    id: raw.id || `apify-${origin}-${i}-${hashish(raw.url || raw.link || title)}`,
    title,
    company,
    location: location || "Remote / unspecified",
    description: raw.description || raw.descriptionText || "",
    applyUrl: raw.url || raw.link,
    salary: raw.salary || raw.salaryText,
    employmentType: raw.employmentType || raw.jobType,
    postedAt: parseDate(raw.postedAt || raw.postedDate),
    source: "apify",
    tags: origin !== "other" ? [origin] : undefined,
  };
}

export type JobSearchOpts = {
  query: string;
  location?: string;
  limit?: number;
};

export type JobSearchResult = {
  jobs: ScrapedJob[];
  /** Populated only when the actor failed (wrong id, quota, etc). Cached briefly. */
  error?: string;
};

export async function searchJobs(opts: JobSearchOpts): Promise<JobSearchResult> {
  const query = opts.query.trim();
  if (!query) return { jobs: [] };

  const location = (opts.location ?? "").trim();
  const limit = Math.min(Math.max(opts.limit ?? 20, 1), 50);
  const cacheKey = `${query}|${location}|${limit}`;

  return cached<JobSearchResult>(
    "apify:jobs",
    cacheKey,
    async () => {
      const actorIds = parseActorList(ACTORS.jobScraper);
      // Split the row budget so the actors together return about `limit`
      // jobs, the same as one combined actor did.
      const perActor = Math.ceil(limit / Math.max(1, actorIds.length));
      const results = await Promise.all(
        actorIds.map((id) => runOne(id, query, location, perActor)),
      );
      const jobs = results.flatMap((r) => r.jobs).slice(0, limit);
      const errors = results.map((r) => r.error).filter(Boolean);
      return errors.length > 0 ? { jobs, error: errors.join("; ") } : { jobs };
    },
    // When the actor fails we cache for only 5 min so a corrected
    // APIFY_ACTOR_JOB_SCRAPER env var shows up fast.
    { ttlHours: Math.max(1, Number(process.env.JOBS_CACHE_TTL_HOURS || 8)) },
  );
}

/** Run one actor. A failure here never hides jobs from the other actor. */
async function runOne(
  actorId: string,
  query: string,
  location: string,
  maxItems: number,
): Promise<JobSearchResult> {
  const board = boardForActor(actorId);
  if (board) {
    const res = await runActorSync<BoardRow>(
      actorId,
      buildBoardInput(board, { query, location, maxItems }),
      { timeoutSec: 90, limit: maxItems },
    );
    if (!res.ok) return { jobs: [], error: `${actorId}: ${res.error}` };
    const rows = res.rows ?? [];
    const jobs = rows
      .map((r) => mapBoardRow(board, r))
      .filter((j): j is ScrapedJob => Boolean(j));
    const rowError = boardError(rows);
    return rowError ? { jobs, error: `${actorId}: ${rowError}` } : { jobs };
  }

  const res = await runActorSync<RawJob>(
    actorId,
    {
      query,
      location,
      maxItems,
      // The scraper accepts both `searchTerms` and `queries` in some
      // forks; send both for resilience.
      searchTerms: [query],
      queries: [query],
    },
    { timeoutSec: 90, limit: maxItems },
  );
  if (!res.ok) return { jobs: [], error: `${actorId}: ${res.error}` };
  const jobs = (res.rows ?? [])
    .map((r, i) => normalize(r, i))
    .filter((j): j is ScrapedJob => Boolean(j));
  return { jobs };
}

function hashish(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}
