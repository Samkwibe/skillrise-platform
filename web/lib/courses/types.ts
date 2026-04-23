/**
 * Free-course providers we integrate without a dedicated partnership key.
 * `mit` / `khan` lean on the same web-search stack (Brave / Serper) as the
 * rest of the app when those keys are present; they degrade to a "search on
 * the provider" card when not.
 */
export type CourseProviderId =
  | "coursera"
  | "openlibrary"
  | "mit"
  | "khan"
  | "youtube"
  | "simplilearn"
  | "udemy";

export type FreeCourse = {
  id: string;
  title: string;
  description?: string;
  url: string;
  provider: CourseProviderId;
  imageUrl?: string;
  /** Human-readable, when known. */
  durationText?: string;
  /** e.g. first publish year, course length */
  byline?: string;
  /**
   * Heuristic: Coursera is known for paywalled / optional paid certificates
   * that still exist on the provider site. Openly licensed OER usually does not.
   */
  freeCertificateHint?: boolean;
  /** e.g. "Ebook" | "Full course" | "Unit" | "Module" */
  format?: string;
  /** 0-5 when known (YouTube / some APIs) */
  rating?: number;
  /** e.g. review count, learners */
  ratingCountLabel?: string;
  /** e.g. view count (YouTube) */
  viewCount?: number;
  /** For YouTube — watch page URL always works with the player. */
  youtubeVideoId?: string;
  /** For Udemy / curated free listings (badge in UI) */
  isFree?: boolean;
};

export type CourseSearchOptions = {
  query: string;
  /** Subset to run. Default: all. */
  providers?: CourseProviderId[];
  limit?: number;
};

export type CourseSearchResult = {
  query: string;
  courses: FreeCourse[];
  byProvider: Array<{ id: CourseProviderId; count: number; error?: string; skipped?: string }>;
  note?: string;
};

export type CoursePreview = {
  url: string;
  title?: string;
  description?: string;
  imageUrl?: string;
  siteName?: string;
  videoIds: string[];
};
