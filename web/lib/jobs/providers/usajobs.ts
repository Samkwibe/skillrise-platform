/**
 * USAJobs — the official US federal jobs API.
 *
 *   GET https://data.usajobs.gov/api/search?Keyword=...&LocationName=...
 *   Headers:
 *     User-Agent: <your-registered-email>
 *     Authorization-Key: <your-api-key>
 *
 * Free, unlimited, and covers every federal opening including many roles
 * that don't require a degree (maintenance, custodial, administrative,
 * logistics, wage-grade trades). Register at https://developer.usajobs.gov.
 *
 * Env:
 *   USAJOBS_EMAIL    required for User-Agent header (USAJobs policy)
 *   USAJOBS_API_KEY  required, free
 */
import type { JobProvider, ProviderResult, ScrapedJob, JobSearchOpts } from "../types";
import { clampText } from "../types";

type UsaJobsResponse = {
  SearchResult?: {
    SearchResultItems?: Array<{
      MatchedObjectId?: string;
      MatchedObjectDescriptor?: {
        PositionID?: string;
        PositionTitle?: string;
        PositionURI?: string;
        ApplyURI?: string[];
        PositionLocationDisplay?: string;
        PositionLocation?: Array<{ LocationName?: string; CityName?: string; CountryCode?: string }>;
        OrganizationName?: string;
        DepartmentName?: string;
        PositionStartDate?: string;
        PublicationStartDate?: string;
        PositionSchedule?: Array<{ Name?: string }>;
        PositionRemuneration?: Array<{ MinimumRange?: string; MaximumRange?: string; Description?: string }>;
        UserArea?: { Details?: { JobSummary?: string } };
        QualificationSummary?: string;
        JobCategory?: Array<{ Name?: string; Code?: string }>;
      };
    }>;
  };
};

export const usajobsProvider: JobProvider = {
  id: "usajobs",
  isConfigured() {
    return Boolean(process.env.USAJOBS_API_KEY && process.env.USAJOBS_EMAIL);
  },
  async search(opts: JobSearchOpts): Promise<ProviderResult> {
    if (!this.isConfigured()) {
      return { provider: "usajobs", jobs: [], error: "USAJOBS_API_KEY/USAJOBS_EMAIL missing" };
    }
    const limit = Math.min(opts.limit ?? 20, 50);
    const params = new URLSearchParams({
      Keyword: opts.query,
      ResultsPerPage: String(limit),
    });
    if (opts.location) params.set("LocationName", opts.location);

    const url = `https://data.usajobs.gov/api/search?${params.toString()}`;
    try {
      const res = await fetch(url, {
        headers: {
          Host: "data.usajobs.gov",
          "User-Agent": process.env.USAJOBS_EMAIL!,
          "Authorization-Key": process.env.USAJOBS_API_KEY!,
          Accept: "application/json",
        },
        cache: "no-store",
      });
      if (!res.ok) {
        const detail = (await res.text()).slice(0, 200);
        return { provider: "usajobs", jobs: [], error: `HTTP ${res.status}: ${detail}` };
      }
      const body = (await res.json()) as UsaJobsResponse;
      const items = body.SearchResult?.SearchResultItems ?? [];
      const jobs: ScrapedJob[] = items
        .map((it, i): ScrapedJob | null => {
          const d = it.MatchedObjectDescriptor;
          if (!d?.PositionTitle) return null;
          const salaryRanges = d.PositionRemuneration ?? [];
          const salary = salaryRanges[0]
            ? `${formatDollar(salaryRanges[0].MinimumRange)}${
                salaryRanges[0].MaximumRange ? `–${formatDollar(salaryRanges[0].MaximumRange)}` : ""
              }${salaryRanges[0].Description ? ` / ${salaryRanges[0].Description}` : ""}`
            : undefined;
          return {
            id: `usajobs-${it.MatchedObjectId ?? d.PositionID ?? i}`,
            title: d.PositionTitle,
            company: d.OrganizationName || d.DepartmentName || "US Federal Government",
            location: d.PositionLocationDisplay || d.PositionLocation?.[0]?.LocationName || "Multiple US locations",
            description: clampText(d.UserArea?.Details?.JobSummary || d.QualificationSummary),
            applyUrl: d.ApplyURI?.[0] || d.PositionURI,
            salary,
            employmentType: d.PositionSchedule?.[0]?.Name,
            postedAt: toTs(d.PublicationStartDate || d.PositionStartDate),
            source: "usajobs",
            tags: d.JobCategory?.map((c) => c.Name).filter(Boolean) as string[] | undefined,
          };
        })
        .filter((j): j is ScrapedJob => Boolean(j));
      return { provider: "usajobs", jobs };
    } catch (e) {
      return { provider: "usajobs", jobs: [], error: (e as Error).message };
    }
  },
};

function formatDollar(raw: string | undefined): string {
  if (!raw) return "";
  const n = Number(raw);
  if (!Number.isFinite(n)) return raw;
  return n >= 1000 ? `$${Math.round(n / 1000)}k` : `$${Math.round(n)}`;
}

function toTs(s: string | undefined): number | undefined {
  if (!s) return undefined;
  const t = Date.parse(s);
  return Number.isFinite(t) ? t : undefined;
}
