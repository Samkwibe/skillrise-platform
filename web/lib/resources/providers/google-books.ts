/**
 * Google Books — free quota with API key (enable "Books API" in same GCP project as YouTube).
 * https://developers.google.com/books
 */
import {
  clampText,
  hashish,
  type LearningResource,
  type ResourceProvider,
  type ResourceProviderResult,
  type ResourceSearchOpts,
} from "../types";

function googleBooksKey(): string | undefined {
  return (
    process.env.GOOGLE_BOOKS_API_KEY?.trim() ||
    process.env.YOUTUBE_API_KEY?.trim() ||
    undefined
  );
}

export const googleBooksProvider: ResourceProvider = {
  id: "googlebooks",
  label: "Google Books",
  isConfigured() {
    return Boolean(googleBooksKey());
  },
  async search(opts: ResourceSearchOpts): Promise<ResourceProviderResult> {
    const key = googleBooksKey();
    if (!key) {
      return { provider: "googlebooks", items: [], error: "not configured" };
    }
    const q = opts.query.trim();
    if (!q) return { provider: "googlebooks", items: [] };
    const max = Math.min(Math.max(opts.limit ?? 5, 1), 10);
    const params = new URLSearchParams({
      q,
      maxResults: String(max),
      key,
      langRestrict: (opts.language ?? "en").split("-")[0] || "en",
    });
    const url = `https://www.googleapis.com/books/v1/volumes?${params.toString()}`;
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) {
        return { provider: "googlebooks", items: [], error: `HTTP ${res.status}` };
      }
      const data = (await res.json()) as {
        items?: Array<{
          id?: string;
          volumeInfo?: {
            title?: string;
            authors?: string[];
            description?: string;
            imageLinks?: { thumbnail?: string };
            previewLink?: string;
            publishedDate?: string;
            pageCount?: number;
          };
        }>;
      };
      const items: LearningResource[] = [];
      for (const it of data.items ?? []) {
        const vi = it.volumeInfo;
        const title = vi?.title?.trim();
        if (!title) continue;
        const id = it.id || hashish(title);
        const link = vi?.previewLink || `https://books.google.com/books?id=${encodeURIComponent(id)}`;
        const thumb = vi?.imageLinks?.thumbnail?.replace("http:", "https:");
        const author = vi?.authors?.[0];
        const pages = vi?.pageCount;
        items.push({
          id: `googlebooks:${id}`,
          title,
          description: clampText(vi?.description || `${author ? `By ${author}. ` : ""}Preview on Google Books.`, 360),
          url: link,
          thumbnail: thumb,
          author,
          duration: pages ? `${pages} pages` : undefined,
          provider: "googlebooks",
          kind: "book",
          tags: ["preview", "books"],
        });
      }
      return { provider: "googlebooks", items };
    } catch (e) {
      return { provider: "googlebooks", items: [], error: (e as Error).message };
    }
  },
};
