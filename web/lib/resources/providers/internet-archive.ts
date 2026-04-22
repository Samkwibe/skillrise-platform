/**
 * Internet Archive — free search over texts, audio, and video in the public archive.
 * https://archive.org/developers/advancedsearch.html
 */
import { externalApisUserAgent } from "../polite-fetch";
import {
  clampText,
  type LearningResource,
  type ResourceProvider,
  type ResourceProviderResult,
  type ResourceSearchOpts,
} from "../types";

type IADoc = {
  identifier?: string;
  title?: string;
  mediatype?: string;
};

const KIND_MAP: Record<string, LearningResource["kind"]> = {
  audio: "podcast",
  etree: "podcast",
  movies: "video",
  image: "link",
  collection: "link",
  web: "link",
  texts: "book",
  data: "article",
  software: "link",
};

export const internetArchiveProvider: ResourceProvider = {
  id: "internetarchive",
  label: "Internet Archive",
  isConfigured() {
    return true;
  },
  async search(opts: ResourceSearchOpts): Promise<ResourceProviderResult> {
    const q = opts.query.trim();
    if (!q) return { provider: "internetarchive", items: [] };
    const limit = Math.min(Math.max(opts.limit ?? 4, 1), 8);
    // Prefer educational-ish collections: mediatype texts OR audio (librivox, etc.)
    const safe = q.replace(/"/g, " ").trim();
    const query = `(${safe}) AND (mediatype:(texts) OR mediatype:(audio) OR mediatype:(etree) OR mediatype:(movies))`;
    const params = new URLSearchParams();
    params.set("q", query);
    params.append("fl[]", "identifier");
    params.append("fl[]", "title");
    params.append("fl[]", "mediatype");
    params.set("output", "json");
    params.set("rows", String(limit));
    params.append("sort[]", "downloads desc");
    const url = `https://archive.org/advancedsearch.php?${params.toString()}`;
    try {
      const res = await fetch(url, {
        cache: "no-store",
        headers: { "User-Agent": externalApisUserAgent() },
      });
      if (!res.ok) return { provider: "internetarchive", items: [], error: `HTTP ${res.status}` };
      const data = (await res.json()) as { response?: { docs?: IADoc[] } };
      const docs = data.response?.docs ?? [];
      const items: LearningResource[] = [];
      for (const d of docs) {
        const id = d.identifier?.trim();
        const title = d.title?.trim();
        if (!id || !title) continue;
        const mt = d.mediatype || "texts";
        const kind = KIND_MAP[mt] ?? "link";
        const pageUrl = `https://archive.org/details/${encodeURIComponent(id)}`;
        const embed =
          kind === "video"
            ? `https://archive.org/embed/${encodeURIComponent(id)}`
            : undefined;
        items.push({
          id: `internetarchive:${id}`,
          title: clampText(title, 200),
          description: clampText(
            `Archive.org — ${mt}. Public domain and community uploads.`,
            240,
          ),
          url: pageUrl,
          thumbnail: `https://archive.org/services/img/${encodeURIComponent(id)}`,
          author: "Internet Archive",
          provider: "internetarchive",
          kind,
          embedUrl: embed,
          tags: [mt, "archive.org"],
        });
      }
      return { provider: "internetarchive", items };
    } catch (e) {
      return { provider: "internetarchive", items: [], error: (e as Error).message };
    }
  },
};
