import type { FreeCourse } from "../types";
import { stableCourseId } from "../ids";
import { searchCourseraOrgPrograms } from "../coursera-api";

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

/**
 * Public catalog: Coursera search HTML + `/learn/...` slugs. Always works without OAuth.
 */
export async function searchCourseraScrape(query: string, limit: number): Promise<FreeCourse[]> {
  const res = await fetch(
    `https://www.coursera.org/search?query=${encodeURIComponent(query)}`,
    { headers: { "User-Agent": UA, Accept: "text/html" }, cache: "no-store" },
  );
  if (!res.ok) return [];
  const html = await res.text();
  const re = /href="(https:\/\/)?www\.coursera\.org\/learn\/([a-z0-9-]+)"/gi;
  const slugs = new Set<string>();
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    slugs.add(m[2]!);
    if (slugs.size >= limit + 3) break;
  }
  const top = Array.from(slugs).slice(0, limit);
  if (top.length === 0) return [];

  const courses: FreeCourse[] = [];
  for (const slug of top) {
    const url = `https://www.coursera.org/learn/${slug}`;
    const title = (await fetchCourseraTitle(url)) || humanizeSlug(slug);
    courses.push({
      id: stableCourseId("coursera", url),
      provider: "coursera",
      title: title.replace(/\s+\|\s*Coursera.*$/i, "").trim(),
      url,
      freeCertificateHint: true,
      format: "Online course (audit often free)",
    });
  }
  return courses;
}

function humanizeSlug(slug: string): string {
  return slug
    .split(/[-_]+/g)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

async function fetchCourseraTitle(courseUrl: string): Promise<string | null> {
  try {
    const r = await fetch(courseUrl, { headers: { "User-Agent": UA, Accept: "text/html" }, cache: "no-store" });
    if (!r.ok) return null;
    const html = await r.text();
    const og = /property="og:title"\s+content="([^"]+)"/i.exec(html);
    if (og?.[1]) return og[1]!;
    const title = /<title>([^<]+)<\/title>/i.exec(html);
    if (title?.[1]) return title[1]!.replace(/\s+[-|·]\s+Coursera.*/i, "").trim();
  } catch {
    // ignore
  }
  return null;
}

/**
 * Merges **org program API** results (if OAuth + org id work) with **public
 * HTML search** so learners always get multiple Coursera options.
 */
export async function searchCoursera(query: string, limit: number): Promise<FreeCourse[]> {
  const cap = Math.max(limit, 6);
  const [org, web] = await Promise.all([
    searchCourseraOrgPrograms(query, Math.min(8, cap)),
    searchCourseraScrape(query, cap),
  ]);
  const seen = new Set<string>();
  const out: FreeCourse[] = [];
  for (const c of [...org, ...web]) {
    if (seen.has(c.url)) continue;
    seen.add(c.url);
    out.push(c);
    if (out.length >= cap) break;
  }
  return out;
}
