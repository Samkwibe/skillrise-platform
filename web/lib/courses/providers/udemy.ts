import type { FreeCourse } from "../types";
import { stableCourseId } from "../ids";
import { searchSiteCourses } from "../web-search";

const DEFAULT_FREE_LIST_BASE =
  process.env.UDEMY_FREE_COURSES_API_URL?.replace(/\/$/, "") || "https://freecoursefetch.onrender.com";

function mapUnknownApiRow(row: Record<string, unknown>): FreeCourse | null {
  const title =
    (typeof row.title === "string" && row.title) ||
    (typeof row.name === "string" && row.name) ||
    (typeof row.heading === "string" && row.heading) ||
    null;
  const url =
    (typeof row.url === "string" && row.url) ||
    (typeof row.link === "string" && row.link) ||
    (typeof row.course_url === "string" && row.course_url) ||
    null;
  if (!title || !url) return null;
  let u: URL;
  try {
    u = new URL(url, "https://www.udemy.com");
  } catch {
    return null;
  }
  if (!u.hostname.replace(/^www\./, "").endsWith("udemy.com")) return null;
  if (!u.pathname.toLowerCase().includes("/course/")) return null;
  const image =
    (typeof row.image === "string" && row.image) ||
    (typeof row.image_480x270 === "string" && row.image_480x270) ||
    (typeof row.imageUrl === "string" && row.imageUrl) ||
    undefined;
  return {
    id: stableCourseId("udemy", u.toString()),
    provider: "udemy",
    title,
    url: u.toString(),
    imageUrl: image,
    description: typeof row.description === "string" ? row.description : undefined,
    isFree: true,
    byline: "Free listing",
  };
}

/**
 * Tries a few common JSON shapes from free-udemy list mirrors (env override).
 * Fails open if the service is down.
 */
async function fetchFromFreeListApi(q: string, limit: number): Promise<FreeCourse[]> {
  const cap = Math.min(Math.max(limit, 1), 20);
  const paths = ["/courses", "/api/courses", "/v1/courses", "/all"];
  for (const base of [DEFAULT_FREE_LIST_BASE, "https://freecoursefetch.onrender.com"]) {
    for (const path of paths) {
      let url: URL;
      try {
        url = new URL(path, base + "/");
      } catch {
        continue;
      }
      url.searchParams.set("q", q);
      url.searchParams.set("limit", String(cap));
      try {
        const ac = new AbortController();
        const t = setTimeout(() => ac.abort(), 12_000);
        const res = await fetch(url.toString(), {
          cache: "no-store",
          signal: ac.signal,
        });
        clearTimeout(t);
        if (!res.ok) continue;
        const j = (await res.json()) as unknown;
        const raw = Array.isArray(j)
          ? j
          : j && typeof j === "object" && "courses" in j && Array.isArray((j as { courses: unknown }).courses)
            ? (j as { courses: unknown[] }).courses
            : j && typeof j === "object" && "data" in j && Array.isArray((j as { data: unknown }).data)
              ? (j as { data: unknown[] }).data
              : j && typeof j === "object" && "results" in j
                ? (j as { results: unknown[] }).results
                : null;
        if (!raw?.length) continue;
        const out: FreeCourse[] = [];
        for (const item of raw) {
          if (out.length >= cap) break;
          if (!item || typeof item !== "object") continue;
          const m = mapUnknownApiRow(item as Record<string, unknown>);
          if (m) out.push(m);
        }
        if (out.length) return out;
      } catch {
        // try next path
      }
    }
  }
  return [];
}

function looksFree(s: string): boolean {
  return /\$0|100%\s*off|free|coupon|enroll for free|no cost/i.test(s);
}

function isProbablyFreeUrl(u: string): boolean {
  try {
    const x = new URL(u);
    return x.hostname.endsWith("udemy.com");
  } catch {
    return false;
  }
}

/**
 * Free-oriented Udemy discovery: optional JSON list API + site:udemy.com web search
 * (requires Serper or Brave), filtered toward free / coupon phrasing.
 */
export async function searchUdemyFree(
  q: string,
  limit: number,
): Promise<{ courses: FreeCourse[]; skipped?: string; error?: string }> {
  const [apiRows, web] = await Promise.all([
    fetchFromFreeListApi(q, limit),
    searchSiteCourses("udemy", "udemy.com", `${q} free OR coupon "100% off"`, limit, "/course/"),
  ]);

  const bucket: FreeCourse[] = [];
  for (const c of apiRows) {
    if (c.url && isProbablyFreeUrl(c.url)) bucket.push(c);
  }
  for (const c of web.courses) {
    const title = c.title || "";
    const desc = c.description || "";
    const heur = looksFree(`${title} ${desc} ${c.url}`);
    bucket.push({
      ...c,
      isFree: heur,
      byline: c.byline ?? (heur ? "Appears free / coupon (search)" : "Confirm price on Udemy before enrolling"),
    });
  }

  const seen = new Set<string>();
  const deduped: FreeCourse[] = [];
  for (const c of bucket) {
    if (seen.has(c.url)) continue;
    seen.add(c.url);
    deduped.push(c);
    if (deduped.length >= limit) break;
  }

  if (deduped.length === 0 && web.error) {
    return { courses: [] as FreeCourse[], skipped: web.skipped, error: web.error };
  }
  return { courses: deduped, skipped: web.skipped };
}
