import { getDb } from "@/lib/db";
import type { CourseAssignment, AssignmentSubmission, CourseGradebookOverride } from "@/lib/course/lms-types";
import type { Track, User } from "@/lib/store";
import type { Quiz, QuizAttempt } from "@/lib/quiz/types";

const TRACK_QUIZ_PREFIX = "track:";

export function trackQuizCourseKey(slug: string) {
  return `${TRACK_QUIZ_PREFIX}${slug}`;
}

export type GradebookRow = {
  user: Pick<User, "id" | "name" | "email">;
  sectionId?: string;
  /** assignmentId -> { score, max } */
  assignmentScores: Record<string, { score: number; max: number; percent: number } | null>;
  /** quizId -> best attempt */
  quizScores: Record<string, { scorePct: number; quizId: string; title: string } | null>;
  quizAveragePercent: number | null;
  assignmentAveragePercent: number | null;
  /** 0-100 */
  finalPercent: number | null;
  finalLetter: string;
  override?: CourseGradebookOverride | null;
};

function letter(n: number | null) {
  if (n == null) return "—";
  if (n >= 90) return "A";
  if (n >= 80) return "B";
  if (n >= 70) return "C";
  if (n >= 60) return "D";
  return "F";
}

/**
 * Build gradebook matrix for a track. Uses quizzes whose `courseKey` is `track:<trackSlug>`.
 */
export async function buildGradebookForTrack(
  track: Track,
  pairs: { user: User; sectionId?: string }[],
  assignments: CourseAssignment[],
): Promise<GradebookRow[]> {
  const db = getDb();
  const courseKey = trackQuizCourseKey(track.slug);
  const quizzes: Quiz[] = await db.listQuizzesByCourseKey(courseKey);

  const aw = track.gradebookWeights?.assignment ?? 50;
  const qw = track.gradebookWeights?.quiz ?? 50;
  const wSum = aw + qw || 1;
  const awN = (aw / wSum) * 100;
  const qwN = (qw / wSum) * 100;

  const rows: GradebookRow[] = [];

  for (const { user, sectionId } of pairs) {
    const subs = await db.listSubmissionsByUserTrack(user.id, track.slug);
    const assignmentScores: Record<string, { score: number; max: number; percent: number } | null> = {};
    for (const a of assignments) {
      const s = subs.find((x) => x.assignmentId === a.id && (x.status === "graded" || x.status === "returned"));
      if (s?.score != null && a.pointsPossible > 0) {
        const pct = (s.score / a.pointsPossible) * 100;
        assignmentScores[a.id] = { score: s.score, max: a.pointsPossible, percent: pct };
      } else {
        assignmentScores[a.id] = null;
      }
    }

    const allAttempts: QuizAttempt[] = await db.listQuizAttemptsByUserId(user.id);
    const quizScores: Record<string, { scorePct: number; quizId: string; title: string } | null> = {};
    const byQuiz: number[] = [];
    for (const q of quizzes) {
      const att = allAttempts
        .filter((x) => x.quizId === q.id && x.scorePct != null)
        .sort((a, b) => (b.scorePct ?? 0) - (a.scorePct ?? 0));
      const best = att[0];
      if (best?.scorePct != null) {
        quizScores[q.id] = { scorePct: best.scorePct, quizId: q.id, title: q.title };
        byQuiz.push(best.scorePct);
      } else {
        quizScores[q.id] = null;
      }
    }

    const assignmentVals = Object.values(assignmentScores).filter(Boolean) as { percent: number }[];
    const assignmentAveragePercent = assignmentVals.length
      ? assignmentVals.reduce((s, v) => s + v.percent, 0) / assignmentVals.length
      : null;

    const quizAveragePercent = byQuiz.length ? byQuiz.reduce((a, b) => a + b, 0) / byQuiz.length : null;

    let finalPercent: number | null = null;
    if (assignments.length === 0 && quizzes.length === 0) {
      finalPercent = null;
    } else if (assignments.length > 0 && quizzes.length === 0) {
      finalPercent = assignmentAveragePercent;
    } else if (quizzes.length > 0 && assignments.length === 0) {
      finalPercent = quizAveragePercent;
    } else {
      const a = assignmentAveragePercent;
      const qv = quizAveragePercent;
      if (a != null && qv != null) {
        finalPercent = (a * awN) / 100 + (qv * qwN) / 100;
      } else {
        finalPercent = a ?? qv ?? null;
      }
    }

    const override = await db.getGradebookOverride(track.slug, user.id);
    if (override?.finalPercentOverride != null) {
      finalPercent = override.finalPercentOverride;
    }

    rows.push({
      user: { id: user.id, name: user.name, email: user.email },
      sectionId,
      assignmentScores,
      quizScores,
      quizAveragePercent,
      assignmentAveragePercent,
      finalPercent,
      finalLetter: letter(finalPercent),
      override,
    });
  }

  return rows;
}

export function gradebookToCsv(
  trackTitle: string,
  assignments: CourseAssignment[],
  rows: GradebookRow[],
  quizzes: { id: string; title: string }[],
): string {
  const header = [
    "Name",
    "Email",
    ...assignments.map((a) => `A: ${a.title} (${a.pointsPossible}pts)`),
    ...quizzes.map((q) => `Q: ${q.title}`),
    "Avg assignments %",
    "Avg quizzes %",
    "Final %",
    "Letter",
  ];
  const lines = [header.join(",")];
  for (const r of rows) {
    const parts = [csvCell(r.user.name), csvCell(r.user.email)];
    for (const a of assignments) {
      const x = r.assignmentScores[a.id];
      parts.push(x ? csvCell(`${x.score}/${x.max}`) : "");
    }
    for (const q of quizzes) {
      const x = r.quizScores[q.id];
      parts.push(x ? csvCell(String(x.scorePct)) : "");
    }
    parts.push(
      csvCell(r.assignmentAveragePercent != null ? r.assignmentAveragePercent.toFixed(1) : ""),
      csvCell(r.quizAveragePercent != null ? r.quizAveragePercent.toFixed(1) : ""),
      csvCell(r.finalPercent != null ? r.finalPercent.toFixed(1) : ""),
      csvCell(r.finalLetter),
    );
    lines.push(parts.join(","));
  }
  return lines.join("\n");
}

function csvCell(s: string) {
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}
