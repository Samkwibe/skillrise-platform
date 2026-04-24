import { getDb } from "@/lib/db";
import { store, type Track } from "@/lib/store";
import type { CourseAssignment } from "@/lib/course/lms-types";

export type TeacherDeadline = {
  trackSlug: string;
  trackTitle: string;
  assignmentId: string;
  title: string;
  dueAt: number;
};

export type TeacherRecentSubmission = {
  at: number;
  trackSlug: string;
  trackTitle: string;
  studentName: string;
  assignmentTitle: string;
  status: string;
};

export type TeacherCourseSummary = {
  slug: string;
  title: string;
  heroEmoji: string;
  color: string;
  enrolled: number;
  pendingGrades: number;
};

/**
 * Aggregates grading queue, deadlines, and recent submission activity for a teacher's courses.
 */
export async function buildTeacherDashboard(teacherId: string): Promise<{
  pendingGradesTotal: number;
  upcomingDeadlines: TeacherDeadline[];
  recentSubmissions: TeacherRecentSubmission[];
  courseSummaries: TeacherCourseSummary[];
}> {
  const db = getDb();
  await db.ready();
  const tracks = store.tracks.filter((t) => t.teacherId === teacherId);
  const now = Date.now();
  let pendingGradesTotal = 0;
  const deadlines: TeacherDeadline[] = [];
  type SubEvent = {
    at: number;
    track: Track;
    assignment: CourseAssignment;
    studentName: string;
    status: string;
  };
  const events: SubEvent[] = [];
  const courseSummaries: TeacherCourseSummary[] = [];

  for (const t of tracks) {
    const assignments = await db.listAssignmentsByTrack(t.slug);
    let coursePending = 0;
    for (const a of assignments) {
      if (a.dueAt > now) {
        deadlines.push({
          trackSlug: t.slug,
          trackTitle: t.title,
          assignmentId: a.id,
          title: a.title,
          dueAt: a.dueAt,
        });
      }
      const subs = await db.listSubmissionsByAssignment(a.id);
      for (const s of subs) {
        if (s.status === "submitted") {
          pendingGradesTotal += 1;
          coursePending += 1;
        }
        const u = await db.findUserById(s.userId);
        if (u && (s.status === "submitted" || s.status === "graded" || s.status === "returned")) {
          events.push({
            at: s.submittedAt,
            track: t,
            assignment: a,
            studentName: u.name,
            status: s.status,
          });
        }
      }
    }
    const enrollments = await db.listEnrollmentsByTrack(t.slug);
    courseSummaries.push({
      slug: t.slug,
      title: t.title,
      heroEmoji: t.heroEmoji,
      color: t.color,
      enrolled: enrollments.length,
      pendingGrades: coursePending,
    });
  }

  deadlines.sort((a, b) => a.dueAt - b.dueAt);
  events.sort((a, b) => b.at - a.at);

  const recentSubmissions: TeacherRecentSubmission[] = events.slice(0, 10).map((e) => ({
    at: e.at,
    trackSlug: e.track.slug,
    trackTitle: e.track.title,
    studentName: e.studentName,
    assignmentTitle: e.assignment.title,
    status: e.status,
  }));

  return {
    pendingGradesTotal,
    upcomingDeadlines: deadlines.slice(0, 10),
    recentSubmissions,
    courseSummaries: courseSummaries.sort((a, b) => a.title.localeCompare(b.title)),
  };
}
