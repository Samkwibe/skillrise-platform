import { findUserById, type Track, type User, type Role } from "@/lib/store";
import { UdemyCourseCard, type CourseCardModel } from "./udemy-course-card";
import { getEnrollmentCountForTrack, getReviewStatsForTrack, formatCourseDurationLabel } from "@/lib/services/course-discovery-stats";
import { getDb } from "@/lib/db";

const STAFF_PICKS = new Set(["electrical-basics", "web-dev-starter", "first-budget"]);

function canUseWishlist(role: Role) {
  return role === "learner" || role === "teen" || role === "teacher" || role === "admin";
}

async function toCard(
  t: Track,
  user: User | null,
  extraBadges: string[],
  enrollmentRanks: Map<string, number>,
): Promise<CourseCardModel> {
  const teacher = findUserById(t.teacherId) ?? null;
  const [stats, n] = await Promise.all([getReviewStatsForTrack(t.slug), getEnrollmentCountForTrack(t.slug)]);
  let wishlisted = false;
  if (user && canUseWishlist(user.role)) {
    const db = getDb();
    await db.ready();
    wishlisted = await db.isWishlisted(user.id, t.slug);
  }
  const badges: string[] = ["Free"];
  if (STAFF_PICKS.has(t.slug)) badges.push("Staff pick");
  const rank = enrollmentRanks.get(t.slug) ?? 999;
  if (rank < 3 && n > 0) badges.push("Bestseller");
  if (stats.averageRating >= 4.5 && stats.reviewCount >= 1) badges.push("Top rated");
  for (const b of extraBadges) {
    if (!badges.includes(b)) badges.push(b);
  }
  return {
    track: t,
    teacher,
    enrollmentCount: n,
    averageRating: stats.averageRating,
    reviewCount: stats.reviewCount,
    durationLabel: formatCourseDurationLabel(t),
    badges: [...new Set(badges)].slice(0, 5),
    wishlisted,
    showWishlist: user ? canUseWishlist(user.role) : false,
  };
}

function sectionTitle(id: string) {
  switch (id) {
    case "featured":
      return "Featured";
    case "trending":
      return "Trending now";
    case "new":
      return "New & noteworthy";
    case "top":
      return "Top rated";
    case "bestsellers":
      return "Bestsellers";
    case "staff":
      return "Staff picks";
    default:
      return "Courses";
  }
}

type Props = { user: User; baseTracks: Track[]; allTracks: Track[]; youthOnly: boolean };

export async function TracksBrowseSections({ user, baseTracks, allTracks, youthOnly }: Props) {
  const counts: { slug: string; n: number }[] = [];
  for (const t of allTracks) {
    const n = await getEnrollmentCountForTrack(t.slug);
    counts.push({ slug: t.slug, n });
  }
  counts.sort((a, b) => b.n - a.n);
  const rankMap = new Map(counts.map((c, i) => [c.slug, i]));

  const featured = baseTracks.filter((t) => STAFF_PICKS.has(t.slug)).slice(0, 6);
  const trending = [...baseTracks].sort(
    (a, b) => (rankMap.get(a.slug) ?? 99) - (rankMap.get(b.slug) ?? 99),
  );
  const withRatings = await Promise.all(
    baseTracks.map(async (t) => ({ t, s: await getReviewStatsForTrack(t.slug) })),
  );
  withRatings.sort((a, b) => b.s.averageRating - a.s.averageRating);
  const topSorted = withRatings.filter((x) => x.s.averageRating >= 4.3 && x.s.reviewCount >= 1).map((x) => x.t);

  const newest = [...baseTracks].reverse().slice(0, 6);
  const staffOnly = baseTracks.filter((t) => STAFF_PICKS.has(t.slug)).slice(0, 6);

  const sections: { id: string; items: Track[]; extra: string[] }[] = [
    { id: "featured", items: featured.length ? featured : trending.slice(0, 3), extra: [] },
    { id: "trending", items: trending.slice(0, 6), extra: [] },
    { id: "top", items: topSorted.slice(0, 6).length ? topSorted.slice(0, 6) : trending.slice(0, 4), extra: [] },
    { id: "new", items: newest, extra: [] },
    { id: "bestsellers", items: trending.slice(0, 6), extra: [] },
    { id: "staff", items: staffOnly.length ? staffOnly : featured, extra: [] },
  ];
  const seen = new Set<string>();
  const deduped = sections.map((sec) => ({
    ...sec,
    items: sec.items.filter((t) => {
      if (seen.has(t.slug)) return false;
      seen.add(t.slug);
      return true;
    }),
  }));

  const sectionsWithCards = await Promise.all(
    deduped.map(async (sec) => ({
      ...sec,
      cards: await Promise.all(sec.items.map((t) => toCard(t, user, sec.extra, rankMap))),
    })),
  );
  const allGridCards = await Promise.all(baseTracks.map((t) => toCard(t, user, [], rankMap)));

  return (
    <div className="space-y-12">
      {sectionsWithCards.map((sec) =>
        sec.items.length === 0 ? null : (
          <section key={sec.id} className="max-w-7xl mx-auto px-4 sm:px-6">
            <h2 className="text-xl font-extrabold text-slate-900 mb-1">{sectionTitle(sec.id)}</h2>
            {sec.id === "trending" && (
              <p className="text-sm text-slate-600 mb-4">Most enrolled — great starting points.</p>
            )}
            {sec.id === "new" && <p className="text-sm text-slate-600 mb-4">Recently highlighted on the platform.</p>}
            {sec.id === "staff" && <p className="text-sm text-slate-600 mb-4">Hand-picked by the SkillRise team.</p>}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {sec.cards.map((m) => (
                <UdemyCourseCard key={`${sec.id}-${m.track.slug}`} {...m} />
              ))}
            </div>
          </section>
        ),
      )}

      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <h2 className="text-xl font-extrabold text-slate-900 mb-4">
          All {youthOnly ? "youth " : ""}courses in this view
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {allGridCards.map((m) => (
            <UdemyCourseCard key={m.track.slug} {...m} />
          ))}
        </div>
      </section>
    </div>
  );
}
