import type { CourseProviderId, CourseSearchOptions, CourseSearchResult, FreeCourse } from "./types";
import { searchOpenLibrary } from "./providers/openlibrary";
import { searchCoursera } from "./providers/coursera";
import { searchKhan, searchMIT } from "./providers/mit-khan";
import { searchYouTubeEducational } from "./providers/youtube";
import { searchSimplilearn } from "./providers/simplilearn";
import { cached } from "@/lib/cache/tiered-cache";

const ALL: CourseProviderId[] = [
  "coursera",
  "youtube",
  "openlibrary",
  "mit",
  "khan",
  "simplilearn",
];

const ttlHours = Math.max(2, Number(process.env.COURSES_CACHE_TTL_HOURS || 12));

export async function searchFreeCourses(opts: CourseSearchOptions): Promise<CourseSearchResult> {
  const query = opts.query.trim();
  if (!query) {
    return { query: "", courses: [], byProvider: [] };
  }

  const limit = Math.min(Math.max(opts.limit ?? 16, 1), 36);
  const per = Math.max(3, Math.ceil(limit / Math.max(1, (opts.providers?.length ?? ALL.length))));
  const want = opts.providers?.length ? opts.providers : ALL;
  const cacheKey = `${query}|${want.sort().join(",")}|${limit}`;

  return cached<CourseSearchResult>(
    "courses:unified",
    cacheKey,
    () => run(query, want, per, limit),
    { ttlHours },
  );
}

async function run(
  query: string,
  providers: CourseProviderId[],
  perProvider: number,
  cap: number,
): Promise<CourseSearchResult> {
  const byProvider: CourseSearchResult["byProvider"] = [];
  const bucket: FreeCourse[] = [];

  const results = await Promise.all(
    providers.map(async (p): Promise<void> => {
      try {
        if (p === "coursera") {
          const c = await searchCoursera(query, perProvider);
          byProvider.push({ id: p, count: c.length });
          bucket.push(...c);
        } else if (p === "openlibrary") {
          const c = await searchOpenLibrary(query, perProvider);
          byProvider.push({ id: p, count: c.length });
          bucket.push(...c);
        } else if (p === "mit") {
          const r = await searchMIT(query, perProvider);
          byProvider.push({ id: p, count: r.courses.length, skipped: r.skipped });
          bucket.push(...r.courses);
        } else if (p === "khan") {
          const r = await searchKhan(query, perProvider);
          byProvider.push({ id: p, count: r.courses.length, skipped: r.skipped });
          bucket.push(...r.courses);
        } else if (p === "youtube") {
          const c = await searchYouTubeEducational(query, perProvider);
          byProvider.push({ id: p, count: c.length, skipped: !process.env.YOUTUBE_API_KEY ? "YOUTUBE_API_KEY not set" : undefined });
          bucket.push(...c);
        } else if (p === "simplilearn") {
          const r = await searchSimplilearn(query, perProvider);
          byProvider.push({ id: p, count: r.courses.length, skipped: r.skipped });
          bucket.push(...r.courses);
        }
      } catch (e) {
        byProvider.push({ id: p, count: 0, error: (e as Error).message });
      }
    }),
  );
  void results;

  // Interleave across providers to maximize diversity
  const byP = new Map<CourseProviderId, FreeCourse[]>();
  for (const p of providers) {
    byP.set(
      p,
      bucket.filter((c) => c.provider === p),
    );
  }

  const merged: FreeCourse[] = [];
  for (let round = 0; round < 50; round++) {
    for (const p of providers) {
      const list = byP.get(p) ?? [];
      if (list[0]) {
        merged.push(list[0]!);
        list.splice(0, 1);
        byP.set(p, list);
      }
    }
    if (merged.length >= cap) break;
  }

  const seen = new Set<string>();
  const deduped: FreeCourse[] = [];
  for (const c of merged) {
    if (seen.has(c.url)) continue;
    seen.add(c.url);
    deduped.push(c);
    if (deduped.length >= cap) break;
  }

  let note: string | undefined;
  if (deduped.length === 0) {
    note = "No free-course matches. Try a shorter or broader keyword.";
  } else {
    const skip = byProvider
      .filter((b) => b.skipped && b.count === 0)
      .map((b) => b.id);
    if (skip.length) {
      note = `Some sources need API keys: ${skip.join(", ")}. Open Library, Coursera, and (with keys) the rest.`;
    }
  }

  return { query, courses: deduped, byProvider, note };
}
