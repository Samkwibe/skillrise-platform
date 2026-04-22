/**
 * Shared types for the jobs subsystem.
 *
 * Every provider (Adzuna, Remotive, USAJobs, Apify) returns the same
 * normalized `ScrapedJob` so the UI doesn't care which source served it.
 */
export type JobProviderId =
  | "adzuna"
  | "remotive"
  | "usajobs"
  | "apify"
  | "google"
  | "other";

export type ScrapedJob = {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  applyUrl?: string;
  salary?: string;
  employmentType?: string;
  postedAt?: number;
  source: JobProviderId;
  /** Optional skill tags extracted from title/description. Used for light matching. */
  tags?: string[];
};

export type JobSearchOpts = {
  query: string;
  location?: string;
  limit?: number;
  /** Region/country hint for provider selection ("us", "gb", etc). Default "us". */
  country?: string;
};

export type ProviderResult = {
  provider: JobProviderId;
  jobs: ScrapedJob[];
  error?: string;
};

export interface JobProvider {
  id: JobProviderId;
  /** Whether the provider has what it needs (keys etc.) to run. */
  isConfigured(): boolean;
  search(opts: JobSearchOpts): Promise<ProviderResult>;
}

/** Trim/normalize a text blob for snippets and consistent hashing. */
export function clampText(s: string | undefined, max = 600): string {
  if (!s) return "";
  const clean = s.replace(/\s+/g, " ").trim();
  return clean.length > max ? clean.slice(0, max - 1) + "…" : clean;
}
