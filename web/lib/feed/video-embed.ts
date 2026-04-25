/** Derive a YouTube embed URL from a watch or youtu.be link. */
export function getYoutubeEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname === "www.youtube.com" || u.hostname === "youtube.com" || u.hostname === "m.youtube.com") {
      const v = u.searchParams.get("v");
      if (v) return `https://www.youtube.com/embed/${encodeURIComponent(v)}`;
    }
    if (u.hostname === "youtu.be") {
      const id = u.pathname.replace(/^\//, "").split("/")[0];
      if (id) return `https://www.youtube.com/embed/${encodeURIComponent(id)}`;
    }
  } catch {
    return null;
  }
  return null;
}

/** e.g. https://vimeo.com/123456 */
export function getVimeoEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname === "vimeo.com" || u.hostname === "www.vimeo.com") {
      const id = u.pathname.split("/").filter(Boolean)[0];
      if (id && /^\d+$/.test(id)) return `https://player.vimeo.com/video/${id}`;
    }
  } catch {
    return null;
  }
  return null;
}

export function isLikelyDirectVideoFile(url: string): boolean {
  return /\.(mp4|webm|ogv|ogg)(\?|$)/i.test(url);
}

export type VideoEmbedType = "youtube" | "vimeo" | "direct" | "none";

export function classifyVideoUrl(url: string | undefined | null): {
  type: VideoEmbedType;
  embedUrl: string | null;
  srcUrl: string | null;
} {
  if (!url?.trim()) return { type: "none", embedUrl: null, srcUrl: null };
  const u = url.trim();
  const yt = getYoutubeEmbedUrl(u);
  if (yt) return { type: "youtube", embedUrl: yt, srcUrl: null };
  const vm = getVimeoEmbedUrl(u);
  if (vm) return { type: "vimeo", embedUrl: vm, srcUrl: null };
  if (isLikelyDirectVideoFile(u) && (u.startsWith("https://") || u.startsWith("http://"))) {
    return { type: "direct", embedUrl: null, srcUrl: u };
  }
  return { type: "none", embedUrl: null, srcUrl: null };
}
