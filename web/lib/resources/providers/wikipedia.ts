/**
 * Wikipedia — free, no API key. MediaWiki search + snippets.
 * https://www.mediawiki.org/wiki/API:Search
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

type SearchHit = { title?: string; snippet?: string; pageid?: number };

export const wikipediaProvider: ResourceProvider = {
  id: "wikipedia",
  label: "Wikipedia",
  isConfigured() {
    return true;
  },
  async search(opts: ResourceSearchOpts): Promise<ResourceProviderResult> {
    const q = opts.query.trim();
    if (!q) return { provider: "wikipedia", items: [] };
    const limit = Math.min(Math.max(opts.limit ?? 5, 1), 8);
    const params = new URLSearchParams({
      action: "query",
      list: "search",
      format: "json",
      srlimit: String(limit),
      srsearch: q,
      origin: "*",
      srprop: "snippet|titlesnippet",
    });
    const url = `https://en.wikipedia.org/w/api.php?${params.toString()}`;
    try {
      const res = await fetch(url, {
        cache: "no-store",
        headers: { "User-Agent": externalApisUserAgent() },
        next: { revalidate: 0 },
      });
      if (!res.ok) return { provider: "wikipedia", items: [], error: `HTTP ${res.status}` };
      const data = (await res.json()) as {
        query?: { search?: SearchHit[] };
      };
      const hits = data.query?.search ?? [];
      const items: LearningResource[] = [];
      for (const h of hits) {
        const title = h.title?.trim();
        if (!title) continue;
        const slug = title.replace(/ /g, "_");
        items.push({
          id: `wikipedia:${h.pageid ?? hashish(title)}`,
          title,
          description: clampText(
            (h.snippet || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() ||
              "Wikipedia article — open to read the full text.",
            320,
          ),
          url: `https://en.wikipedia.org/wiki/${encodeURIComponent(slug)}`,
          author: "Wikipedia",
          language: opts.language ?? "en",
          provider: "wikipedia",
          kind: "article",
          tags: ["encyclopedia", "reference"],
        });
      }
      return { provider: "wikipedia", items };
    } catch (e) {
      return { provider: "wikipedia", items: [], error: (e as Error).message };
    }
  },
};
