import { getDb } from "@/lib/db";
import { trackQuizCourseKey } from "@/lib/services/lms-gradebook";
import { listAtRiskStudentsForTeacher } from "@/lib/services/at-risk-students";
import type { Track } from "@/lib/store";

export async function buildCourseAnalytics(track: Track, teacherId: string) {
  const db = getDb();
  await db.ready();
  const courseKey = trackQuizCourseKey(track.slug);
  const quizzes = await db.listQuizzesByCourseKey(courseKey);
  const enrollments = await db.listEnrollmentsByTrack(track.slug);
  const modN = Math.max(1, track.modules.length);
  let sumCompletion = 0;
  for (const e of enrollments) {
    sumCompletion += (e.completedModuleIds.length / modN) * 100;
  }
  const avgTrackCompletion = enrollments.length ? sumCompletion / enrollments.length : 0;

  const atRisk = (await listAtRiskStudentsForTeacher(teacherId)).filter((r) => r.trackSlug === track.slug);

  /** % of enrolled students who have completed each module (curriculum order). */
  const moduleCompletion: { moduleId: string; label: string; pct: number }[] = track.modules.map((m, i) => {
    if (enrollments.length === 0) {
      return { moduleId: m.id, label: `L${i + 1}`, pct: 0 };
    }
    const done = enrollments.filter((e) => e.completedModuleIds.includes(m.id)).length;
    return {
      moduleId: m.id,
      label: m.title.length > 28 ? `L${i + 1}` : m.title,
      pct: Math.round((done / enrollments.length) * 1000) / 10,
    };
  });

  const quizAverages: { quizId: string; title: string; averagePct: number | null; studentsWithScore: number }[] = [];
  for (const q of quizzes) {
    let sum = 0;
    let n = 0;
    for (const e of enrollments) {
      const attempts = await db.listQuizAttemptsByUserId(e.userId);
      const forQ = attempts.filter((a) => a.quizId === q.id);
      if (forQ.length === 0) continue;
      const best = Math.max(...forQ.map((a) => a.scorePct ?? 0));
      sum += best;
      n += 1;
    }
    quizAverages.push({
      quizId: q.id,
      title: q.title,
      averagePct: n > 0 ? Math.round((sum / n) * 10) / 10 : null,
      studentsWithScore: n,
    });
  }

  return {
    trackSlug: track.slug,
    title: track.title,
    enrollCount: enrollments.length,
    graduated: enrollments.filter((e) => e.completedAt).length,
    avgTrackCompletion: Math.round(avgTrackCompletion * 10) / 10,
    moduleCompletion,
    quizAverages,
    atRisk,
  };
}
