/**
 * Shared types for the learning-resources subsystem.
 *
 * One normalized `LearningResource` shape across every provider so the
 * dashboard + search UI doesn't have to know where a card came from.
 * Mirrors the pattern we use for jobs (`lib/jobs/types.ts`).
 */
export type ResourceProviderId =
  | "openlibrary"
  | "mit-ocw"
  | "youtube"
  | "coursera"
  | "khan"
  | "edx"
  | "harvard"
  | "alison"
  | "freecodecamp"
  /** No key — MediaWiki */
  | "wikipedia"
  /** No key — scholarly metadata */
  | "openalex"
  /** Optional Google key (same project as YouTube if both APIs enabled) */
  | "googlebooks"
  /** No key — texts, audio, video on Archive.org */
  | "internetarchive"
  /** No key — research papers (rate-limit friendly) */
  | "semanticscholar"
  | "other";

/** Coarse content kind — drives the player we render (video / book / article). */
export type ResourceKind = "video" | "course" | "book" | "article" | "podcast" | "link";

export type LearningResource = {
  /** Stable id used for save/unsave. Format: `<provider>:<externalId>` */
  id: string;
  title: string;
  /** Short description (already trimmed). */
  description: string;
  /** Canonical public URL to open if embedding isn't possible. */
  url: string;
  /** Image/thumbnail URL when the provider gives us one. */
  thumbnail?: string;
  /** Optional duration hint ("12 min", "6 weeks", "240 pages"). */
  duration?: string;
  /** Author, institution, or channel name. */
  author?: string;
  /** ISO language tag when known (defaults to "en"). */
  language?: string;
  /** Approximate published / updated timestamp (ms). */
  publishedAt?: number;
  /** Canonical source. */
  provider: ResourceProviderId;
  /** Player hint. */
  kind: ResourceKind;
  /**
   * A URL that can be safely embedded in an <iframe>. Only set when the
   * provider explicitly supports embedding (YouTube embed, Open Library
   * reader iframe, MIT OCW YouTube videos). When absent the UI falls
   * back to "Open on <provider>".
   */
  embedUrl?: string;
  /** Optional free-certificate flag. */
  freeCertificate?: boolean;
  /** Free-form tags (topics, categories). */
  tags?: string[];
  /**
   * True when this card is a deep-link to the provider's search page,
   * not a specific item. Rendered differently in the UI.
   */
  isDeepLink?: boolean;
};

export type ResourceSearchOpts = {
  query: string;
  /** Max items per provider. */
  limit?: number;
  /** Language preference, defaults to "en". */
  language?: string;
};

export type ResourceProviderResult = {
  provider: ResourceProviderId;
  items: LearningResource[];
  error?: string;
};

export interface ResourceProvider {
  id: ResourceProviderId;
  /** Human label for filter pills. */
  label: string;
  /** Whether the provider has what it needs (keys etc.) to run. */
  isConfigured(): boolean;
  search(opts: ResourceSearchOpts): Promise<ResourceProviderResult>;
}

/** Trim + collapse whitespace + enforce a max length. */
export function clampText(s: string | undefined, max = 400): string {
  if (!s) return "";
  const clean = s.replace(/\s+/g, " ").trim();
  return clean.length > max ? clean.slice(0, max - 1) + "…" : clean;
}

/** Short stable hash for constructing resource ids. */
export function hashish(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}
