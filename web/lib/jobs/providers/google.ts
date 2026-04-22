/**
 * Google Jobs provider — Apify actor `orgupdate/google-jobs-scraper`.
 *
 * Google Jobs is an aggregator of aggregators: one query surfaces postings
 * from Indeed, LinkedIn, ZipRecruiter, company career sites, etc. We keep
 * the canonical `source: "google"` but record the real upstream board in
 * `tags` (e.g. ["Indeed"]) so the UI can show it as a tooltip on the badge.
 *
 * Input keys were verified against a live run of this actor:
 *   { countryName, companyName, locationName, includeKeyword, pagesToFetch, datePosted }
 *
 * Output keys (live sample):
 *   { job_title, company_name, location, posted_via, salary, date, URL, description }
 *
 * Notes on fields:
 *   - `salary` can be the string "N/A" — we normalize to undefined.
 *   - `date` is relative English ("17 days ago") — best-effort parse to a
 *     timestamp so the orchestrator's "newest first" sort still works.
 *   - `URL` is the `google.com/search?ibp=htl;jobs...` deep link, which
 *     opens the job panel. That's the only durable URL Google exposes
 *     before the user clicks through to the upstream apply page.
 */
import type {
  JobProvider,
  JobSearchOpts,
  ProviderResult,
  ScrapedJob,
} from "../types";
import { clampText } from "../types";
import { ACTORS, isApifyEnabled, runActorSync } from "@/lib/apify/client";

type RawGoogleJob = {
  job_title?: string;
  company_name?: string;
  location?: string;
  posted_via?: string;
  salary?: string;
  date?: string;
  URL?: string;
  description?: string;
};

export const googleJobsProvider: JobProvider = {
  id: "google",
  isConfigured() {
    // APIFY_API_TOKEN is required. The actor id has a safe default, so
    // we don't gate on APIFY_ACTOR_GOOGLE_JOBS.
    return isApifyEnabled();
  },
  async search(opts: JobSearchOpts): Promise<ProviderResult> {
    if (!isApifyEnabled()) {
      return { provider: "google", jobs: [], error: "APIFY_API_TOKEN missing" };
    }

    const limit = Math.min(Math.max(opts.limit ?? 20, 1), 50);
    // Google Jobs returns ~10 cards per page, so fetch enough pages
    // to satisfy `limit` with a little slack. Capped at 3 to keep
    // the pay-per-event cost predictable.
    const pagesToFetch = Math.min(3, Math.max(1, Math.ceil(limit / 10)));

    const res = await runActorSync<RawGoogleJob>(
      ACTORS.googleJobs,
      {
        includeKeyword: opts.query,
        locationName: opts.location ?? "",
        countryName: countryNameFromCode(opts.country),
        companyName: "",
        pagesToFetch,
        datePosted: "all",
      },
      { timeoutSec: 90, limit },
    );

    if (!res.ok) {
      return { provider: "google", jobs: [], error: res.error };
    }

    const jobs = (res.rows ?? [])
      .map((raw, i) => normalize(raw, i, opts.query))
      .filter((j): j is ScrapedJob => Boolean(j));

    return { provider: "google", jobs };
  },
};

function normalize(
  raw: RawGoogleJob,
  i: number,
  query: string,
): ScrapedJob | null {
  const title = raw.job_title?.trim();
  const company = raw.company_name?.trim();
  if (!title || !company) return null;

  const salaryRaw = raw.salary?.trim();
  const salary =
    salaryRaw && salaryRaw.toUpperCase() !== "N/A" ? salaryRaw : undefined;

  const postedVia = raw.posted_via?.trim();
  const tags = postedVia ? [postedVia] : undefined;

  return {
    id: `google-${i}-${hashish((raw.URL || title) + "|" + query)}`,
    title,
    company,
    location: raw.location?.trim() || "Location not specified",
    description: clampText(raw.description, 1200),
    applyUrl: raw.URL,
    salary,
    postedAt: parseRelativeDate(raw.date),
    source: "google",
    tags,
  };
}

/**
 * The actor expects English country names ("United States"), not 2-letter
 * codes. We only map the handful our UI actually sends; anything else
 * falls through to empty (which the actor treats as global).
 */
function countryNameFromCode(code: string | undefined): string {
  const c = (code || "").toLowerCase();
  switch (c) {
    case "us":
      return "United States";
    case "gb":
    case "uk":
      return "United Kingdom";
    case "ca":
      return "Canada";
    case "au":
      return "Australia";
    case "de":
      return "Germany";
    case "fr":
      return "France";
    case "in":
      return "India";
    default:
      return "";
  }
}

/**
 * Convert strings like "17 days ago", "3 hours ago", "just now", or
 * "2 weeks ago" into an approximate Unix ms timestamp. Returns undefined
 * on anything unrecognized so the orchestrator's sort falls back to
 * salary/description length.
 */
function parseRelativeDate(s: string | undefined): number | undefined {
  if (!s) return undefined;
  const str = s.trim().toLowerCase();
  if (!str || str === "just now" || str === "today") return Date.now();
  const m = str.match(/(\d+)\s*(minute|hour|day|week|month|year)s?\s+ago/);
  if (!m) return undefined;
  const n = parseInt(m[1], 10);
  if (!Number.isFinite(n)) return undefined;
  const unit = m[2];
  const ms =
    unit === "minute"
      ? n * 60_000
      : unit === "hour"
        ? n * 3_600_000
        : unit === "day"
          ? n * 86_400_000
          : unit === "week"
            ? n * 7 * 86_400_000
            : unit === "month"
              ? n * 30 * 86_400_000
              : unit === "year"
                ? n * 365 * 86_400_000
                : 0;
  return Date.now() - ms;
}

function hashish(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}
