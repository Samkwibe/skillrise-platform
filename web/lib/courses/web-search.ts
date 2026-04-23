/**
 * Generic web search used to discover course-like pages on domains that are
 * fully client-rendered (OCW, Khan). Reuses BRAVE_SEARCH_API_KEY / SERPER_API_KEY
 * from the skill-search stack — no new env vars.
 */
import type { CourseProviderId, FreeCourse } from "./types";
import { stableCourseId } from "./ids";

type Organic = { title?: string; link?: string; snippet?: string };

async function serperWeb(q: string, num: number): Promise<Organic[] | null> {
  const key = process.env.SERPER_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch("https://google.serper.dev/search", {
      method: "POST",
      headers: { "X-API-KEY": key, "Content-Type": "application/json" },
      body: JSON.stringify({ q, num: Math.min(Math.max(num, 1), 10) }),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { organic?: Organic[] };
    return data.organic ?? [];
  } catch {
    return null;
  }
}

async function braveWeb(q: string, count: number): Promise<Organic[] | null> {
  const key = process.env.BRAVE_SEARCH_API_KEY;
  if (!key) return null;
  try {
    const params = new URLSearchParams({ q, count: String(Math.min(Math.max(count, 1), 20)), safesearch: "strict" });
    const res = await fetch(`https://api.search.brave.com/res/v1/web/search?${params}`, {
      headers: { "X-Subscription-Token": key, Accept: "application/json" },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { web?: { results?: Array<{ title?: string; url?: string; description?: string }> } };
    const rows = data.web?.results ?? [];
    return rows.map((r) => ({ title: r.title, link: r.url, snippet: r.description }));
  } catch {
    return null;
  }
}

/**
 * Search inside a specific site. Tries Serper first, then Brave.
 */
export async function searchSiteCourses(
  provider: CourseProviderId,
  siteHost: string,
  query: string,
  limit: number,
  pathIncludes?: string,
): Promise<{ courses: FreeCourse[]; error?: string; skipped?: string }> {
  const q = `site:${siteHost} ${query}`.trim();
  let rows = await serperWeb(q, limit);
  if (!rows || rows.length === 0) rows = await braveWeb(q, limit);

  if (!rows || rows.length === 0) {
    return {
      courses: [],
      skipped: "No web search API key (Serper or Brave), or no matches.",
    };
  }

  const courses: FreeCourse[] = [];
  for (const r of rows) {
    if (!r.link) continue;
    let u: URL;
    try {
      u = new URL(r.link);
    } catch {
      continue;
    }
    if (!u.hostname.endsWith(siteHost)) continue;
    if (pathIncludes && !u.pathname.toLowerCase().includes(pathIncludes.toLowerCase())) continue;
    const formatLabel =
      provider === "mit"
        ? "MIT OCW"
        : provider === "khan"
          ? "Khan Academy"
          : provider === "simplilearn"
            ? "Simplilearn"
            : provider === "udemy"
              ? "Udemy"
              : "Web";
    courses.push({
      id: stableCourseId(provider, u.toString()),
      provider,
      title: (r.title || "Untitled").replace(/\s+[-|•]\s*.*$/, "").trim(),
      description: r.snippet,
      url: u.toString(),
      format: formatLabel,
    });
    if (courses.length >= limit) break;
  }

  if (courses.length === 0) {
    return { courses: [], error: "No in-site links matched the expected path on that site." };
  }
  return { courses };
}
