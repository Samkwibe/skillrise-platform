/**
 * Semantic Scholar — free paper search (no key for light use).
 * https://api.semanticscholar.org/
 */
import { externalApisUserAgent } from "../polite-fetch";
import {
  clampText,
  type LearningResource,
  type ResourceProvider,
  type ResourceProviderResult,
  type ResourceSearchOpts,
} from "../types";

type Paper = {
  paperId?: string;
  title?: string;
  year?: string;
  authors?: Array<{ name?: string }>;
  url?: string;
  openAccessPdf?: { url?: string };
};

export const semanticScholarProvider: ResourceProvider = {
  id: "semanticscholar",
  label: "Semantic Scholar",
  isConfigured() {
    return true;
  },
  async search(opts: ResourceSearchOpts): Promise<ResourceProviderResult> {
    const q = opts.query.trim();
    if (!q) return { provider: "semanticscholar", items: [] };
    const limit = Math.min(Math.max(opts.limit ?? 4, 1), 8);
    const params = new URLSearchParams({
      query: q,
      limit: String(limit),
      fields: "title,year,authors,url,openAccessPdf,externalIds",
    });
    const url = `https://api.semanticscholar.org/graph/v1/paper/search?${params.toString()}`;
    try {
      const res = await fetch(url, {
        cache: "no-store",
        headers: { "User-Agent": externalApisUserAgent() },
      });
      if (!res.ok) return { provider: "semanticscholar", items: [], error: `HTTP ${res.status}` };
      const data = (await res.json()) as { data?: Paper[] };
      const rows = data.data ?? [];
      const items: LearningResource[] = [];
      for (const p of rows) {
        const title = p.title?.trim();
        const id = p.paperId;
        if (!title || !id) continue;
        const author = p.authors?.[0]?.name;
        const href = p.openAccessPdf?.url || p.url || `https://www.semanticscholar.org/paper/${id}`;
        const y = p.year;
        const yearNum = typeof y === "number" ? y : y != null ? Number(y) : NaN;
        items.push({
          id: `semanticscholar:${id}`,
          title,
          description: clampText(
            [author, !Number.isNaN(yearNum) ? `· ${yearNum}` : ""].filter(Boolean).join(" "),
            300,
          ),
          url: href,
          author: author || "Semantic Scholar",
          language: opts.language ?? "en",
          publishedAt: !Number.isNaN(yearNum) ? Date.UTC(yearNum, 0, 1) : undefined,
          provider: "semanticscholar",
          kind: "article",
          tags: ["paper", "research"],
        });
      }
      return { provider: "semanticscholar", items };
    } catch (e) {
      return { provider: "semanticscholar", items: [], error: (e as Error).message };
    }
  },
};
