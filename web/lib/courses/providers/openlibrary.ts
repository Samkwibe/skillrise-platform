import type { FreeCourse } from "../types";
import { stableCourseId } from "../ids";

const API = "https://openlibrary.org/search.json";

export async function searchOpenLibrary(query: string, limit: number): Promise<FreeCourse[]> {
  const params = new URLSearchParams({ q: query, limit: String(Math.min(Math.max(limit, 1), 20)), fields: "key,title,author_name,first_publish_year,number_of_pages_med,cover_i,cover_edition_key,ia,ebook_access" });
  const res = await fetch(`${API}?${params}`, { next: { revalidate: 3600 } });
  if (!res.ok) return [];
  const data = (await res.json()) as {
    docs?: Array<{
      key?: string;
      title?: string;
      author_name?: string[];
      first_publish_year?: number;
      number_of_pages_med?: number;
      cover_i?: number;
      ia?: string[];
      ebook_access?: string;
    }>;
  };
  const docs = data.docs ?? [];
  const out: FreeCourse[] = [];
  for (const d of docs) {
    if (!d.key) continue;
    const path = d.key.startsWith("/") ? d.key : `/${d.key}`;
    const url = `https://openlibrary.org${path}`;
    const cover = d.cover_i
      ? `https://covers.openlibrary.org/b/id/${d.cover_i}-M.jpg`
      : undefined;
    out.push({
      id: stableCourseId("openlibrary", url),
      provider: "openlibrary",
      title: d.title || "Untitled work",
      description: d.author_name?.length
        ? `By ${d.author_name.slice(0, 2).join(", ")}${d.author_name.length > 2 ? "…" : ""}.`
        : "Open Library ebook or catalog entry.",
      url,
      imageUrl: cover,
      byline: [d.first_publish_year && `First published ${d.first_publish_year}`, d.number_of_pages_med && `${d.number_of_pages_med} pages`]
        .filter(Boolean)
        .join(" · "),
      format: d.ebook_access === "public" || d.ia?.length ? "Ebook (many borrowable)" : "Catalog / preview",
    });
    if (out.length >= limit) break;
  }
  return out;
}
