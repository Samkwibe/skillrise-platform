import { getDb } from "@/lib/db";
import { store, getTrack } from "@/lib/store";
import { ensureTracksFromDatabase } from "@/lib/course/ensure-tracks";

export type AtRiskStudentRow = {
  userId: string;
  name: string;
  email: string;
  trackSlug: string;
  trackTitle: string;
  reasons: string[];
};

const MS_14D = 14 * 24 * 60 * 60 * 1000;
const MS_7D = 7 * 24 * 60 * 60 * 1000;

/**
 * Heuristic at-risk flags for learners enrolled in tracks owned by this teacher.
 * Uses enrollments, sessions, and quiz attempts when available.
 */
export async function listAtRiskStudentsForTeacher(teacherId: string): Promise<AtRiskStudentRow[]> {
  await ensureTracksFromDatabase();
  const trackSlugs = store.tracks.filter((t) => t.teacherId === teacherId).map((t) => t.slug);
  if (trackSlugs.length === 0) return [];

  const db = getDb();
  const now = Date.now();
  const byUser = new Map<string, AtRiskStudentRow>();

  for (const slug of trackSlugs) {
    const track = getTrack(slug);
    if (!track) continue;
    const nMod = Math.max(1, track.modules.length);
    const enrollments = await db.listEnrollmentsByTrack(slug);

    for (const e of enrollments) {
      if (e.completedAt) continue;

      const u = await db.findUserById(e.userId);
      if (!u) continue;

      const reasons: string[] = [];
      const pct = Math.round((e.completedModuleIds.length / nMod) * 100);

      if (now - e.startedAt > MS_14D && pct < 50) {
        reasons.push(`Low track progress (~${pct}% of modules) after 2+ weeks`);
      }

      const sessions = await db.listSessionsByUserId(e.userId);
      const lastAct = sessions.length
        ? Math.max(...sessions.map((s) => s.lastUsedAt ?? s.createdAt))
        : 0;
      if (lastAct > 0 && now - lastAct > MS_7D) {
        reasons.push("No recent activity (7+ days since last session)");
      } else if (sessions.length === 0 && now - e.startedAt > MS_7D) {
        reasons.push("No recorded sessions since enrollment (sign-in data may be limited)");
      }

      const attempts = await db.listQuizAttemptsByUserId(e.userId);
      const below = attempts.filter((a) => a.scorePct != null && a.scorePct < 60);
      if (below.length >= 2) {
        reasons.push(`${below.length} scored quiz attempts below 60%`);
      }

      if (reasons.length === 0) continue;

      const key = `${e.userId}::${slug}`;
      const existing = byUser.get(key);
      if (existing) {
        existing.reasons = [...new Set([...existing.reasons, ...reasons])];
      } else {
        byUser.set(key, {
          userId: u.id,
          name: u.name,
          email: u.email,
          trackSlug: slug,
          trackTitle: track.title,
          reasons: [...reasons],
        });
      }
    }
  }

  return Array.from(byUser.values()).sort((a, b) => a.name.localeCompare(b.name));
}
