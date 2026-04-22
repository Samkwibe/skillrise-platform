/**
 * Apify job scraper provider — thin wrapper around our existing
 * `lib/apify/jobs-scraper.ts`. Lives here so the orchestrator can treat
 * Apify as just another provider instead of a special case.
 *
 * The actor id is controlled by `APIFY_ACTOR_JOB_SCRAPER`; we intentionally
 * don't hardcode a default here because it's user-tunable.
 */
import type { JobProvider, ProviderResult, JobSearchOpts } from "../types";
import { searchJobs } from "@/lib/apify/jobs-scraper";
import { isApifyEnabled } from "@/lib/apify/client";

export const apifyJobsProvider: JobProvider = {
  id: "apify",
  isConfigured() {
    return isApifyEnabled() && Boolean(process.env.APIFY_ACTOR_JOB_SCRAPER);
  },
  async search(opts: JobSearchOpts): Promise<ProviderResult> {
    if (!this.isConfigured()) {
      return { provider: "apify", jobs: [], error: "APIFY_API_TOKEN or APIFY_ACTOR_JOB_SCRAPER missing" };
    }
    const res = await searchJobs({
      query: opts.query,
      location: opts.location,
      limit: opts.limit,
    });
    // `searchJobs` already stamps every job as `source: "apify"` and
    // records the real origin (linkedin/indeed) in `tags`.
    return { provider: "apify", jobs: res.jobs, error: res.error };
  },
};
