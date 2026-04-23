import { getDb } from "@/lib/db";
import type { Track } from "@/lib/store";
import { getTrack } from "@/lib/store";
import { ensureTracksFromDatabase } from "@/lib/course/ensure-tracks";

function isTrackCompletedForUser(
  pre: Track,
  completedModuleIds: string[],
  completedAt?: number,
): boolean {
  if (completedAt) return true;
  if (!pre.modules.length) return true;
  return pre.modules.every((m) => completedModuleIds.includes(m.id));
}

/**
 * Returns missing prerequisite course slugs (titles resolved by caller for UI).
 */
export async function getMissingPrerequisites(userId: string, track: Track): Promise<string[]> {
  const slugs = track.prerequisiteSlugs ?? [];
  if (slugs.length === 0) return [];
  const db = getDb();
  await db.ready();
  const missing: string[] = [];
  for (const slug of slugs) {
    await ensureTracksFromDatabase();
    const pre = getTrack(slug);
    if (!pre) {
      missing.push(slug);
      continue;
    }
    const e = await db.getEnrollment(userId, slug);
    if (!e || !isTrackCompletedForUser(pre, e.completedModuleIds, e.completedAt)) {
      missing.push(slug);
    }
  }
  return missing;
}
