/**
 * Adzuna — free developer tier (signup at https://developer.adzuna.com/).
 *
 * Coverage is broad and global: trades, warehouse, retail, healthcare,
 * hospitality, drivers, admin, etc. Much better than Remotive for the
 * SkillRise audience. Free tier: 250 calls/day per app.
 *
 * Env:
 *   ADZUNA_APP_ID     free
 *   ADZUNA_APP_KEY    free
 *   ADZUNA_COUNTRY    optional, 2-letter lowercase (default: us)
 *
 * Endpoint:
 *   GET https://api.adzuna.com/v1/api/jobs/{country}/search/{page}
 *       ?app_id=...&app_key=...&what=<query>&where=<loc>&results_per_page=N
 */
import type { JobProvider, ProviderResult, ScrapedJob, JobSearchOpts } from "../types";
import { clampText } from "../types";

type AdzunaResult = {
  results?: Array<{
    id?: string | number;
    title?: string;
    description?: string;
    redirect_url?: string;
    company?: { display_name?: string };
    location?: { display_name?: string; area?: string[] };
    salary_min?: number;
    salary_max?: number;
    salary_is_predicted?: string | number;
    contract_type?: string;
    contract_time?: string;
    created?: string;
    category?: { label?: string; tag?: string };
  }>;
};

export const adzunaProvider: JobProvider = {
  id: "adzuna",
  isConfigured() {
    return Boolean(process.env.ADZUNA_APP_ID && process.env.ADZUNA_APP_KEY);
  },
  async search(opts: JobSearchOpts): Promise<ProviderResult> {
    if (!this.isConfigured()) {
      return { provider: "adzuna", jobs: [], error: "ADZUNA_APP_ID/KEY missing" };
    }
    const country = (opts.country || process.env.ADZUNA_COUNTRY || "us").toLowerCase();
    const limit = Math.min(opts.limit ?? 20, 50);
    const params = new URLSearchParams({
      app_id: process.env.ADZUNA_APP_ID!,
      app_key: process.env.ADZUNA_APP_KEY!,
      what: opts.query,
      results_per_page: String(limit),
      "content-type": "application/json",
    });
    if (opts.location) params.set("where", opts.location);

    const url = `https://api.adzuna.com/v1/api/jobs/${encodeURIComponent(country)}/search/1?${params.toString()}`;
    try {
      const res = await fetch(url, {
        headers: { Accept: "application/json", "User-Agent": "SkillRise/1.0" },
        cache: "no-store",
      });
      if (!res.ok) {
        const detail = (await res.text()).slice(0, 200);
        return { provider: "adzuna", jobs: [], error: `HTTP ${res.status}: ${detail}` };
      }
      const body = (await res.json()) as AdzunaResult;
      const jobs: ScrapedJob[] = (body.results ?? [])
        .filter((r) => r.title && r.redirect_url)
        .map((r, i): ScrapedJob => ({
          id: `adzuna-${r.id ?? i}`,
          title: r.title!,
          company: r.company?.display_name || "—",
          location: r.location?.display_name || "—",
          description: clampText(r.description),
          applyUrl: r.redirect_url!,
          salary: formatSalary(r.salary_min, r.salary_max),
          employmentType: r.contract_type || r.contract_time,
          postedAt: toTs(r.created),
          source: "adzuna",
          tags: r.category?.label ? [r.category.label] : undefined,
        }));
      return { provider: "adzuna", jobs };
    } catch (e) {
      return { provider: "adzuna", jobs: [], error: (e as Error).message };
    }
  },
};

function formatSalary(min: number | undefined, max: number | undefined): string | undefined {
  if (!min && !max) return undefined;
  const fmt = (n: number) =>
    n >= 1000 ? `$${Math.round(n / 1000)}k` : `$${Math.round(n)}`;
  if (min && max && min !== max) return `${fmt(min)}–${fmt(max)}`;
  return fmt(min || max || 0);
}

function toTs(s: string | undefined): number | undefined {
  if (!s) return undefined;
  const t = Date.parse(s);
  return Number.isFinite(t) ? t : undefined;
}
