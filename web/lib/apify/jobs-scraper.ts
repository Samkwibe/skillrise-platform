/**
 * Live jobs via Apify actor (potent_xenoblast: linkedin-indeed-scraper).
 *
 * Replaces the mock `store.jobs` on the /jobs page for learners who want
 * real-time openings. Results are cached in DynamoDB for
 * `JOBS_CACHE_TTL_HOURS` (default 8h) keyed on `(query|location)`.
 *
 * The actor's exact input shape varies by fork; we send the common keys
 * and shape the output to our local `ScrapedJob` type, tolerating missing
 * fields. The UI already handles partial data (see app/(app)/jobs/page.tsx).
 */
import { runActorSync, ACTORS } from "./client";
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

function parseDate(s: string | undefined): number | undefined {
  if (!s) return undefined;
  const t = Date.parse(s);
  return Number.isFinite(t) ? t : undefined;
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
      const res = await runActorSync<RawJob>(
        ACTORS.jobScraper,
        {
          query,
          location,
          maxItems: limit,
          // The scraper accepts both `searchTerms` and `queries` in some
          // forks; send both for resilience.
          searchTerms: [query],
          queries: [query],
        },
        { timeoutSec: 90, limit },
      );
      if (!res.ok) return { jobs: [], error: res.error };
      const rows = res.rows ?? [];
      const jobs = rows
        .map((r, i) => normalize(r, i))
        .filter((j): j is ScrapedJob => Boolean(j));
      return { jobs };
    },
    // When the actor fails we cache for only 5 min so a corrected
    // APIFY_ACTOR_JOB_SCRAPER env var shows up fast.
    { ttlHours: Math.max(1, Number(process.env.JOBS_CACHE_TTL_HOURS || 8)) },
  );
}

function hashish(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}
