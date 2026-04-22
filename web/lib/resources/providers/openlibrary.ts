/**
 * Open Library provider — free ebooks + books with reader embeds.
 *
 * Docs: https://openlibrary.org/developers/api
 *
 * We use the search endpoint and filter to books that actually have a
 * "borrow" or "read" availability flag. For those, Open Library exposes
 * an embeddable reader at `archive.org/embed/<ocaid>` which we use to
 * show the book inside our modal — no sign-up needed on our side.
 */
import {
  clampText,
  hashish,
  type LearningResource,
  type ResourceProvider,
  type ResourceProviderResult,
  type ResourceSearchOpts,
} from "../types";

type OLResponse = {
  docs?: Array<{
    key?: string;
    title?: string;
    author_name?: string[];
    first_publish_year?: number;
    cover_i?: number;
    subject?: string[];
    ia?: string[]; // Internet Archive identifiers — used for the embed
    ebook_access?: "public" | "borrowable" | "printdisabled" | "no_ebook";
    number_of_pages_median?: number;
    language?: string[];
  }>;
};

export const openLibraryProvider: ResourceProvider = {
  id: "openlibrary",
  label: "Open Library",
  isConfigured() {
    return true;
  },
  async search(opts: ResourceSearchOpts): Promise<ResourceProviderResult> {
    const limit = Math.min(Math.max(opts.limit ?? 12, 1), 24);
    const params = new URLSearchParams({
      q: opts.query,
      limit: String(limit),
      // Only keep fields we actually use — smaller response, faster parse.
      fields:
        "key,title,author_name,first_publish_year,cover_i,subject,ia,ebook_access,number_of_pages_median,language",
    });
    const url = `https://openlibrary.org/search.json?${params.toString()}`;
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) {
        return {
          provider: "openlibrary",
          items: [],
          error: `HTTP ${res.status}`,
        };
      }
      const data = (await res.json()) as OLResponse;
      const docs = data.docs ?? [];
      const items: LearningResource[] = [];
      for (const d of docs) {
        const title = d.title?.trim();
        if (!title) continue;
        const key = d.key || `/works/${hashish(title)}`;
        const readable =
          d.ebook_access === "public" || d.ebook_access === "borrowable";
        const ocaid = readable ? d.ia?.[0] : undefined;
        const thumbnail = d.cover_i
          ? `https://covers.openlibrary.org/b/id/${d.cover_i}-M.jpg`
          : undefined;
        items.push({
          id: `openlibrary:${key.replace(/^\/+/, "").replace(/\//g, "_")}`,
          title,
          description: clampText(
            [
              d.author_name?.[0],
              d.first_publish_year ? `first published ${d.first_publish_year}` : "",
              (d.subject ?? []).slice(0, 3).join(", "),
            ]
              .filter(Boolean)
              .join(" · "),
            300,
          ),
          url: `https://openlibrary.org${key}`,
          thumbnail,
          author: d.author_name?.[0],
          duration: d.number_of_pages_median
            ? `${d.number_of_pages_median} pages`
            : undefined,
          language: d.language?.[0] ?? opts.language ?? "en",
          publishedAt: d.first_publish_year
            ? Date.UTC(d.first_publish_year, 0, 1)
            : undefined,
          provider: "openlibrary",
          kind: "book",
          // Archive.org embed — works without login for public-domain
          // books; borrowable books show a "borrow to read" prompt.
          embedUrl: ocaid
            ? `https://archive.org/embed/${encodeURIComponent(ocaid)}`
            : undefined,
          tags: d.subject?.slice(0, 5),
        });
      }
      return { provider: "openlibrary", items };
    } catch (e) {
      return { provider: "openlibrary", items: [], error: (e as Error).message };
    }
  },
};
