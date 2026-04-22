/**
 * Remotive — public jobs API, no key required.
 *
 *   GET https://remotive.com/api/remote-jobs?search=<term>&limit=<n>
 *
 * Coverage skews toward remote-friendly roles (tech, writing, customer
 * support, marketing). Not ideal for trades but great for anyone willing
 * to work remotely or needing a foot in the door.
 */
import type { JobProvider, ProviderResult, ScrapedJob, JobSearchOpts } from "../types";
import { clampText } from "../types";

type RemotiveJob = {
  id?: number | string;
  url?: string;
  title?: string;
  company_name?: string;
  category?: string;
  tags?: string[];
  job_type?: string;
  publication_date?: string;
  candidate_required_location?: string;
  salary?: string;
  description?: string;
};

const ENDPOINT = "https://remotive.com/api/remote-jobs";

export const remotiveProvider: JobProvider = {
  id: "remotive",
  isConfigured() {
    // Remotive is a public, keyless API; always "configured".
    return true;
  },
  async search(opts: JobSearchOpts): Promise<ProviderResult> {
    const { query } = opts;
    const limit = Math.min(opts.limit ?? 20, 50);
    try {
      const params = new URLSearchParams({
        search: query,
        limit: String(limit),
      });
      const res = await fetch(`${ENDPOINT}?${params.toString()}`, {
        headers: { Accept: "application/json", "User-Agent": "SkillRise/1.0" },
        cache: "no-store",
      });
      if (!res.ok) {
        return { provider: "remotive", jobs: [], error: `HTTP ${res.status}` };
      }
      const body = (await res.json()) as { jobs?: RemotiveJob[] };
      const raw = body.jobs ?? [];
      const jobs: ScrapedJob[] = raw
        .filter((j) => j.title && j.url)
        .map((j, i): ScrapedJob => ({
          id: `remotive-${j.id ?? i}`,
          title: (j.title ?? "").replace(/\s*<[^>]+>\s*/g, " ").trim(),
          company: j.company_name || "—",
          location: j.candidate_required_location || "Remote",
          description: clampText(stripHtml(j.description)),
          applyUrl: j.url!,
          salary: j.salary || undefined,
          employmentType: j.job_type || undefined,
          postedAt: toTs(j.publication_date),
          source: "remotive",
          tags: j.tags?.slice(0, 8),
        }));
      return { provider: "remotive", jobs };
    } catch (e) {
      return { provider: "remotive", jobs: [], error: (e as Error).message };
    }
  },
};

function stripHtml(s: string | undefined): string {
  if (!s) return "";
  // Fast-enough stripper: drop tags, decode the entities we actually see
  // from Remotive's HTML-in-JSON payloads. We're not trying to render; we
  // just want a readable snippet.
  return s
    .replace(/<\/?[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"');
}

function toTs(s: string | undefined): number | undefined {
  if (!s) return undefined;
  const t = Date.parse(s);
  return Number.isFinite(t) ? t : undefined;
}
