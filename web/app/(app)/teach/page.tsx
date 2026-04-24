import Link from "next/link";
import { requireVerifiedUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ensureTracksFromDatabase } from "@/lib/course/ensure-tracks";
import { buildTeacherDashboard } from "@/lib/services/teacher-dashboard";

export const dynamic = "force-dynamic";

function fmtDue(ms: number) {
  return new Date(ms).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function fmtAct(ms: number) {
  return new Date(ms).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export default async function TeachDashboardPage() {
  const user = await requireVerifiedUser();
  if (user.role !== "teacher" && user.role !== "admin") redirect("/dashboard");
  await ensureTracksFromDatabase();
  const dash = await buildTeacherDashboard(user.id);

  return (
    <div className="section-pad-x py-8 max-w-6xl mx-auto w-full">
      <header className="mb-8">
        <h1
          className="font-[family-name:var(--role-font-display)] text-[clamp(1.5rem,4vw,2rem)] font-extrabold leading-tight mb-2"
          style={{ color: "var(--text-1)" }}
        >
          Dashboard
        </h1>
        <p className="text-sm max-w-2xl" style={{ color: "var(--text-2)" }}>
          Your courses, grading queue, and deadlines in one place.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-10">
        <div className="card p-5" style={{ border: "1px solid var(--border-1)" }}>
          <div className="text-[11px] font-bold uppercase tracking-wider mb-1" style={{ color: "var(--text-3)" }}>
            To grade
          </div>
          <div
            className="text-3xl font-extrabold tabular-nums"
            style={{ color: dash.pendingGradesTotal > 0 ? "var(--red)" : "var(--text-1)" }}
          >
            {dash.pendingGradesTotal}
          </div>
          <div className="text-[12px] mt-2" style={{ color: "var(--text-3)" }}>
            Submissions awaiting a score
          </div>
        </div>
        <div className="card p-5 sm:col-span-1" style={{ border: "1px solid var(--border-1)" }}>
          <div className="text-[11px] font-bold uppercase tracking-wider mb-1" style={{ color: "var(--text-3)" }}>
            Courses
          </div>
          <div className="text-3xl font-extrabold tabular-nums" style={{ color: "var(--text-1)" }}>
            {dash.courseSummaries.length}
          </div>
          <Link href="/teach/courses" className="text-[12px] mt-2 inline-block font-medium underline" style={{ color: "var(--text-2)" }}>
            My courses →
          </Link>
        </div>
        <div className="card p-5 sm:col-span-2" style={{ border: "1px solid var(--border-1)" }}>
          <div className="text-[11px] font-bold uppercase tracking-wider mb-1" style={{ color: "var(--text-3)" }}>
            Quick actions
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            <Link href="/teach/courses" className="btn btn-primary btn-sm">
              My courses
            </Link>
            <Link href="/teach/messages" className="btn btn-ghost btn-sm">
              Inbox
            </Link>
            <Link href="/teach/quizzes" className="btn btn-ghost btn-sm">
              Quizzes
            </Link>
            <Link href="/teach/record" className="btn btn-ghost btn-sm">
              Record
            </Link>
            <Link href="/teach/live" className="btn btn-ghost btn-sm">
              Live
            </Link>
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <section>
          <h2 className="text-base font-bold mb-3" style={{ color: "var(--text-1)" }}>
            Your courses
          </h2>
          {dash.courseSummaries.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--text-3)" }}>
              No courses assigned yet. When a course is available, it will appear here.
            </p>
          ) : (
            <ul className="space-y-2">
              {dash.courseSummaries.map((c) => (
                <li key={c.slug}>
                  <Link
                    href={`/teach/course/${encodeURIComponent(c.slug)}`}
                    className="card flex flex-wrap items-center justify-between gap-3 p-4 transition-colors hover:brightness-110"
                    style={{ border: "1px solid var(--border-1)" }}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] text-lg"
                        style={{ background: `rgba(${c.color},0.2)` }}
                      >
                        {c.heroEmoji}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold truncate" style={{ color: "var(--text-1)" }}>
                          {c.title}
                        </div>
                        <div className="text-[12px]" style={{ color: "var(--text-3)" }}>
                          {c.enrolled} enrolled
                          {c.pendingGrades > 0 ? (
                            <span style={{ color: "var(--red)" }}> · {c.pendingGrades} to grade</span>
                          ) : null}
                        </div>
                      </div>
                    </div>
                    <span className="text-[12px] font-medium shrink-0" style={{ color: "var(--text-2)" }}>
                      Open →
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h2 className="text-base font-bold mb-3" style={{ color: "var(--text-1)" }}>
            Upcoming deadlines
          </h2>
          {dash.upcomingDeadlines.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--text-3)" }}>
              No future due dates found. Add assignments from a course’s Assignments tab.
            </p>
          ) : (
            <ul className="space-y-2">
              {dash.upcomingDeadlines.slice(0, 8).map((d) => (
                <li
                  key={`${d.trackSlug}-${d.assignmentId}`}
                  className="flex flex-wrap items-baseline justify-between gap-2 rounded-[10px] border px-3 py-2.5 text-[13px]"
                  style={{ borderColor: "var(--border-1)" }}
                >
                  <div className="min-w-0">
                    <div className="font-medium truncate" style={{ color: "var(--text-1)" }}>
                      {d.title}
                    </div>
                    <div className="text-[12px] truncate" style={{ color: "var(--text-3)" }}>
                      {d.trackTitle}
                    </div>
                  </div>
                  <div className="shrink-0 tabular-nums" style={{ color: "var(--text-2)" }}>
                    {fmtDue(d.dueAt)}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="mt-10">
        <h2 className="text-base font-bold mb-3" style={{ color: "var(--text-1)" }}>
          Recent activity
        </h2>
        {dash.recentSubmissions.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--text-3)" }}>
            No recent submissions yet.
          </p>
        ) : (
          <ul className="overflow-x-auto rounded-[10px] border" style={{ borderColor: "var(--border-1)" }}>
            <li
              className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 px-3 py-2 text-[11px] font-bold uppercase tracking-wider"
              style={{ color: "var(--text-3)", borderBottom: "1px solid var(--border-1)" }}
            >
              <span>Student</span>
              <span>Assignment</span>
              <span>Course</span>
              <span className="text-right">When</span>
            </li>
            {dash.recentSubmissions.map((r, i) => (
              <li
                key={`${r.at}-${r.trackSlug}-${i}`}
                className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_1fr_auto] gap-1 sm:gap-2 px-3 py-2.5 text-[13px] border-t"
                style={{ borderColor: "var(--border-1)", color: "var(--text-2)" }}
              >
                <span className="font-medium" style={{ color: "var(--text-1)" }}>
                  {r.studentName}
                </span>
                <span className="min-w-0">{r.assignmentTitle}</span>
                <span className="min-w-0 truncate">{r.trackTitle}</span>
                <span className="text-[12px] sm:text-right tabular-nums" style={{ color: "var(--text-3)" }}>
                  {fmtAct(r.at)} · {r.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
