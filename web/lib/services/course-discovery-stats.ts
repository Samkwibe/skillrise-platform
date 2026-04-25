import { getDb } from "@/lib/db";
import type { Track } from "@/lib/store";
import type { TrackReviewStats } from "@/lib/course/discovery-types";

/** Estimated course duration label from module duration metadata. */
export function formatCourseDurationLabel(track: Track): string {
  const mins = track.modules.reduce((s, m) => s + (m.durationMin ?? 0), 0);
  if (mins <= 0) {
    const w = track.weeks;
    return w ? `~${w} week${w === 1 ? "" : "s"}` : "—";
  }
  const h = Math.round((mins / 60) * 10) / 10;
  if (h < 1) return `${Math.round(mins)} min total`;
  return `~${h} hours`;
}

export async function getReviewStatsForTrack(slug: string): Promise<TrackReviewStats> {
  const db = getDb();
  await db.ready();
  const reviews = await db.listReviewsByTrack(slug);
  if (reviews.length === 0) {
    return {
      averageRating: 0,
      reviewCount: 0,
      ratingDistribution: [
        { stars: 1, count: 0 },
        { stars: 2, count: 0 },
        { stars: 3, count: 0 },
        { stars: 4, count: 0 },
        { stars: 5, count: 0 },
      ],
    };
  }
  const dist = new Map<1 | 2 | 3 | 4 | 5, number>([
    [1, 0],
    [2, 0],
    [3, 0],
    [4, 0],
    [5, 0],
  ]);
  let sum = 0;
  for (const r of reviews) {
    const n = Math.min(5, Math.max(1, Math.round(r.rating))) as 1 | 2 | 3 | 4 | 5;
    dist.set(n, (dist.get(n) ?? 0) + 1);
    sum += r.rating;
  }
  return {
    averageRating: Math.round((sum / reviews.length) * 10) / 10,
    reviewCount: reviews.length,
    ratingDistribution: [1, 2, 3, 4, 5].map((stars) => ({
      stars: stars as 1 | 2 | 3 | 4 | 5,
      count: dist.get(stars as 1 | 2 | 3 | 4 | 5) ?? 0,
    })),
  };
}

export async function getEnrollmentCountForTrack(slug: string): Promise<number> {
  const db = getDb();
  await db.ready();
  const rows = await db.listEnrollmentsByTrack(slug);
  return rows.length;
}
