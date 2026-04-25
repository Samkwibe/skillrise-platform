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

export type TeacherChartData = {
  name: string;
  active: number;
  submissions: number;
};

export type TeacherHeatmapData = number[][];

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
  chartData: TeacherChartData[];
  heatmapData: TeacherHeatmapData;
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

  // Build chartData and heatmapData
  const chartDataMap: Record<string, { activeSet: Set<string>; subs: number }> = {};
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now - i * 86400000);
    chartDataMap[days[d.getDay()]] = { activeSet: new Set(), subs: 0 };
  }

  const heatmapData: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));

  for (const e of events) {
    const d = new Date(e.at);
    const dayStr = days[d.getDay()];
    if (chartDataMap[dayStr]) {
      chartDataMap[dayStr].subs++;
      chartDataMap[dayStr].activeSet.add(e.studentName);
    }
    
    // Heatmap
    heatmapData[d.getDay()][d.getHours()]++;
  }

  const chartData: TeacherChartData[] = Object.keys(chartDataMap).map((k) => ({
    name: k,
    active: chartDataMap[k].activeSet.size,
    submissions: chartDataMap[k].subs,
  }));

  // Reorder chartData to start from 6 days ago up to today
  const orderedChartData: TeacherChartData[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now - i * 86400000);
    const dayStr = days[d.getDay()];
    const found = chartData.find(c => c.name === dayStr);
    if (found) orderedChartData.push(found);
  }

  return {
    pendingGradesTotal,
    upcomingDeadlines: deadlines.slice(0, 10),
    recentSubmissions,
    courseSummaries: courseSummaries.sort((a, b) => a.title.localeCompare(b.title)),
    chartData: orderedChartData,
    heatmapData,
  };
}
