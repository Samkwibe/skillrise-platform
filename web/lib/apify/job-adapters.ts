/**
 * Input builders and row mappers for the LinkedIn and Indeed job actors.
 *
 * The combined `potent_xenoblast~linkedin-indeed-scraper` actor returns 404
 * on the Apify API, so LinkedIn and Indeed now come from two separate
 * actors. Each one has its own input keys and output field names; this file
 * maps both onto our `ScrapedJob` so the rest of the jobs code is unchanged.
 *
 * Field names come from each actor's published dataset schema:
 *   johnvc/indeed-jobs-api    jobId, jobTitle, companyName, location, jobUrl,
 *                             applyUrl, descriptionText, salaryText, jobType,
 *                             datePosted
 *   johnvc/linkedin-jobs-api  jobId, title, companyName, location, jobUrl,
 *                             applyUrl, description, salary, employmentType,
 *                             postedDate
 *
 * Both actors tag every row with `result_type` ("job" or "error"). On a free
 * Apify account a run can also end with a usage-limit notice row
 * (`free_tier_notice: true`, a `message`, no job fields). Only real job rows
 * are mapped; error and notice rows never reach the results.
 *
 * No network or cache imports here, so the fixture test can load it offline.
 */
import type { ScrapedJob } from "../jobs/types";
import { clampText } from "../jobs/types";

export const INDEED_JOBS_ACTOR = "johnvc~indeed-jobs-api";
export const LINKEDIN_JOBS_ACTOR = "johnvc~linkedin-jobs-api";

export type JobBoard = "indeed" | "linkedin";

/** `APIFY_ACTOR_JOB_SCRAPER` holds one actor id or a comma-separated list. */
export function parseActorList(value: string): string[] {
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Which board a configured actor id belongs to, or null for any other actor. */
export function boardForActor(actorId: string): JobBoard | null {
  const id = actorId.trim().replace("/", "~").toLowerCase();
  if (id === INDEED_JOBS_ACTOR) return "indeed";
  if (id === LINKEDIN_JOBS_ACTOR) return "linkedin";
  return null;
}

export type BoardSearch = {
  query: string;
  location: string;
  maxItems: number;
};

export function buildBoardInput(board: JobBoard, s: BoardSearch): Record<string, unknown> {
  // Both actors search the whole country when location is left out.
  const where = s.location ? { location: s.location } : {};
  if (board === "indeed") {
    return {
      mode: "search",
      keywords: [s.query],
      ...where,
      maxResultsPerInput: s.maxItems,
      descriptionFormat: "text",
    };
  }
  return {
    keyword: s.query,
    ...where,
    maxJobs: s.maxItems,
  };
}

export type BoardRow = {
  result_type?: string;
  free_tier_notice?: boolean;
  error_message?: string;
  jobId?: string;
  companyName?: string;
  location?: string;
  jobUrl?: string;
  applyUrl?: string;
  // Indeed
  jobTitle?: string;
  jobLocation?: string;
  descriptionText?: string;
  descriptionMarkdown?: string;
  salaryText?: string;
  jobType?: string;
  datePosted?: string;
  // LinkedIn
  title?: string;
  description?: string;
  salary?: string;
  employmentType?: string;
  postedDate?: string;
};

/** True only for real job rows. Drops error rows and free-tier notice rows. */
export function isJobRow(row: BoardRow): boolean {
  return row.result_type === "job" && !row.free_tier_notice && Boolean(row.jobId);
}

export function mapBoardRow(board: JobBoard, row: BoardRow): ScrapedJob | null {
  if (!isJobRow(row)) return null;
  const indeed = board === "indeed";
  const title = indeed ? row.jobTitle : row.title;
  const company = row.companyName;
  if (!title || !company) return null;
  return {
    id: `apify-${board}-${row.jobId}`,
    title,
    company,
    location: row.location || row.jobLocation || "Remote / unspecified",
    description: clampText(
      indeed ? row.descriptionText || row.descriptionMarkdown : row.description,
    ),
    // The posting page is always present; the direct apply link is not.
    applyUrl: row.jobUrl || row.applyUrl,
    salary: (indeed ? row.salaryText : row.salary) || undefined,
    employmentType: (indeed ? row.jobType : row.employmentType) || undefined,
    postedAt: parseDate(indeed ? row.datePosted : row.postedDate),
    source: "apify",
    tags: [board],
  };
}

/**
 * When a run produced no job rows, the actor's own error row (if any) says
 * why. Surfaced as the provider error so it shows up in `byProvider`.
 */
export function boardError(rows: BoardRow[]): string | undefined {
  if (rows.some(isJobRow)) return undefined;
  return rows.find((r) => r.result_type === "error" && r.error_message)?.error_message;
}

export function parseDate(s: string | undefined): number | undefined {
  if (!s) return undefined;
  const t = Date.parse(s);
  return Number.isFinite(t) ? t : undefined;
}
