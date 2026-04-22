/**
 * OpenAlex — free scholarly works index, no key.
 * https://docs.openalex.org
 */
import { externalApisUserAgent } from "../polite-fetch";
import {
  clampText,
  hashish,
  type LearningResource,
  type ResourceProvider,
  type ResourceProviderResult,
  type ResourceSearchOpts,
} from "../types";

type OAWork = {
  id?: string;
  title?: string;
  publication_year?: number;
  authorships?: Array<{ author?: { display_name?: string } }>;
  best_oa_location?: { landing_page_url?: string };
  primary_location?: { landing_page_url?: string };
};

export const openAlexProvider: ResourceProvider = {
  id: "openalex",
  label: "OpenAlex",
  isConfigured() {
    return true;
  },
  async search(opts: ResourceSearchOpts): Promise<ResourceProviderResult> {
    const q = opts.query.trim();
    if (!q) return { provider: "openalex", items: [] };
    const n = Math.min(Math.max(opts.limit ?? 4, 1), 8);
    const params = new URLSearchParams({ search: q, per_page: String(n) });
    const url = `https://api.openalex.org/works?${params.toString()}`;
    try {
      const res = await fetch(url, {
        cache: "no-store",
        headers: { "User-Agent": externalApisUserAgent() },
      });
      if (!res.ok) return { provider: "openalex", items: [], error: `HTTP ${res.status}` };
      const data = (await res.json()) as { results?: OAWork[] };
      const results = data.results ?? [];
      const items: LearningResource[] = [];
      for (const w of results) {
        const title = w.title?.trim();
        if (!title) continue;
        const id = (w.id || "").replace("https://openalex.org/", "");
        const link =
          w.best_oa_location?.landing_page_url ||
          w.primary_location?.landing_page_url ||
          (id ? `https://openalex.org/${id}` : undefined);
        if (!link) continue;
        const author = w.authorships?.[0]?.author?.display_name;
        items.push({
          id: `openalex:${id || hashish(title)}`,
          title,
          description: clampText(
            [author, w.publication_year ? `· ${w.publication_year}` : ""].filter(Boolean).join(" "),
            300,
          ),
          url: link,
          author: author || "OpenAlex",
          language: opts.language ?? "en",
          publishedAt: w.publication_year ? Date.UTC(w.publication_year, 0, 1) : undefined,
          provider: "openalex",
          kind: "article",
          tags: ["research", "open access"],
        });
      }
      return { provider: "openalex", items };
    } catch (e) {
      return { provider: "openalex", items: [], error: (e as Error).message };
    }
  },
};
