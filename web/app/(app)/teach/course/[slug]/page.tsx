import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireVerifiedUser } from "@/lib/auth";
import { getTrack } from "@/lib/store";
import { canTeacherEditCourse } from "@/lib/services/teacher-course";
import { ensureTracksFromDatabase } from "@/lib/course/ensure-tracks";
import { getDb } from "@/lib/db";
import { buildCourseAnalytics } from "@/lib/services/course-analytics";

export const dynamic = "force-dynamic";

function fmtShort(ms: number) {
  return new Date(ms).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export default async function TeacherCourseOverviewPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await requireVerifiedUser();
  if (user.role !== "teacher" && user.role !== "admin") redirect("/dashboard");
  await ensureTracksFromDatabase();
  const track = getTrack(slug);
  if (!canTeacherEditCourse(user, track) || !track) notFound();

  const db = getDb();
  await db.ready();
  const assignments = await db.listAssignmentsByTrack(slug);
  const now = Date.now();
  let pending = 0;
  for (const a of assignments) {
    const subs = await db.listSubmissionsByAssignment(a.id);
    pending += subs.filter((s) => s.status === "submitted").length;
  }
  const nextDeadline = assignments
    .filter((a) => a.dueAt > now)
    .sort((a, b) => a.dueAt - b.dueAt)[0];
  const analytics = await buildCourseAnalytics(track, user.id);

  return (
    <div>
      <p className="text-sm mb-6" style={{ color: "var(--text-2)" }}>
        Quick stats and links for this course. Use the tabs above to manage roster, assignments, and content.
      </p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="card p-4" style={{ border: "1px solid var(--border-1)" }}>
          <div className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--text-3)" }}>
            Enrolled
          </div>
          <div className="text-2xl font-bold tabular-nums" style={{ color: "var(--text-1)" }}>
            {analytics.enrollCount}
          </div>
        </div>
        <div className="card p-4" style={{ border: "1px solid var(--border-1)" }}>
          <div className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--text-3)" }}>
            To grade
          </div>
          <div className="text-2xl font-bold tabular-nums" style={{ color: pending > 0 ? "var(--red)" : "var(--text-1)" }}>
            {pending}
          </div>
        </div>
        <div className="card p-4" style={{ border: "1px solid var(--border-1)" }}>
          <div className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--text-3)" }}>
            Avg progress
          </div>
          <div className="text-2xl font-bold tabular-nums" style={{ color: "var(--text-1)" }}>
            {analytics.avgTrackCompletion}%
          </div>
        </div>
        <div className="card p-4" style={{ border: "1px solid var(--border-1)" }}>
          <div className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--text-3)" }}>
            At-risk (flagged)
          </div>
          <div className="text-2xl font-bold tabular-nums" style={{ color: "var(--text-1)" }}>
            {analytics.atRisk.length}
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="card p-5" style={{ border: "1px solid var(--border-1)" }}>
          <h2 className="text-base font-bold mb-3" style={{ color: "var(--text-1)" }}>
            Next deadline
          </h2>
          {nextDeadline ? (
            <div className="text-sm" style={{ color: "var(--text-2)" }}>
              <div className="font-semibold" style={{ color: "var(--text-1)" }}>
                {nextDeadline.title}
              </div>
              <div>Due {fmtShort(nextDeadline.dueAt)}</div>
            </div>
          ) : (
            <p className="text-sm" style={{ color: "var(--text-3)" }}>
              No upcoming due dates, or all assignments are past due.
            </p>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href={`/teach/course/${encodeURIComponent(slug)}/assignments`}
              className="btn btn-primary btn-sm"
            >
              {pending > 0 ? `Grade (${pending} waiting)` : "Open assignments"}
            </Link>
          </div>
        </div>
        <div className="card p-5" style={{ border: "1px solid var(--border-1)" }}>
          <h2 className="text-base font-bold mb-3" style={{ color: "var(--text-1)" }}>
            Shortcuts
          </h2>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href={`/teach/course/${encodeURIComponent(slug)}/roster`} className="underline" style={{ color: "var(--text-2)" }}>
                View roster
              </Link>
            </li>
            <li>
              <Link href={`/teach/course/${encodeURIComponent(slug)}/builder`} className="underline" style={{ color: "var(--text-2)" }}>
                Edit content &amp; videos
              </Link>
            </li>
            <li>
              <Link href={`/tracks/${encodeURIComponent(slug)}/messages`} className="underline" style={{ color: "var(--text-2)" }}>
                Message students
              </Link>
            </li>
            <li>
              <Link href={`/tracks/${encodeURIComponent(slug)}`} className="underline" style={{ color: "var(--text-2)" }}>
                Preview as learner
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
