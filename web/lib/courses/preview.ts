/**
 * Server-side HTML peek for course detail: OpenGraph + first YouTube ids.
 * Best-effort only — some providers block bots; we still show the outbound link.
 */
import type { CoursePreview } from "./types";

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

export async function fetchCoursePagePreview(url: string): Promise<CoursePreview> {
  const out: CoursePreview = { url, videoIds: [] };
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA, Accept: "text/html,application/xhtml+xml" },
      cache: "no-store",
      redirect: "follow",
    });
    if (!res.ok) return out;
    const html = (await res.text()).slice(0, 1_200_000);
    out.title = matchMeta(html, "og:title") || matchTag(html, "title");
    out.description = matchMeta(html, "og:description") || matchMeta(html, "description");
    out.imageUrl = matchMeta(html, "og:image");
    out.siteName = matchMeta(html, "og:site_name");
    out.videoIds = extractYoutubeIds(html).slice(0, 5);
  } catch {
    // ignore
  }
  return out;
}

function matchMeta(html: string, prop: string): string | undefined {
  const a = new RegExp(`<meta\\s+property="${prop}"\\s+content="([^"]*)"`, "i").exec(html);
  if (a?.[1]) return decodeEntities(a[1]);
  const b = new RegExp(`<meta\\s+name="${prop}"\\s+content="([^"]*)"`, "i").exec(html);
  if (b?.[1]) return decodeEntities(b[1]);
  return undefined;
}

function matchTag(html: string, tag: string): string | undefined {
  const m = new RegExp(`<${tag}[^>]*>([^<]+)<\/${tag}>`, "i").exec(html);
  return m?.[1] ? decodeEntities(m[1].trim()) : undefined;
}

function extractYoutubeIds(html: string): string[] {
  const ids: string[] = [];
  const re = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube-nocookie\.com\/embed\/)([A-Za-z0-9_-]{6,})/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    if (!ids.includes(m[1]!)) ids.push(m[1]!);
  }
  return ids;
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}
