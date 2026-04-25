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
    <div className="animate-in fade-in duration-500">
      <p className="text-sm text-t2 mb-8 max-w-2xl leading-relaxed">
        Quick stats and links for this course. Use the tabs above to manage roster, assignments, and content.
      </p>
      
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-10">
        <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl hover:bg-white/[0.05] transition-colors relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/10 rounded-full blur-2xl -mr-8 -mt-8 group-hover:bg-blue-500/20 transition-colors"></div>
          <div className="relative z-10 flex flex-col justify-between h-full gap-2">
            <div className="text-[11px] font-bold uppercase tracking-wider text-t3 flex items-center justify-between">
              Enrolled <span className="text-lg opacity-80">👥</span>
            </div>
            <div className="text-3xl font-black text-white tabular-nums drop-shadow-sm">
              {analytics.enrollCount}
            </div>
          </div>
        </div>
        
        <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl hover:bg-white/[0.05] transition-colors relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-16 h-16 bg-orange-500/10 rounded-full blur-2xl -mr-8 -mt-8 group-hover:bg-orange-500/20 transition-colors"></div>
          <div className="relative z-10 flex flex-col justify-between h-full gap-2">
            <div className="text-[11px] font-bold uppercase tracking-wider text-t3 flex items-center justify-between">
              To grade <span className="text-lg opacity-80">📝</span>
            </div>
            <div className={`text-3xl font-black tabular-nums drop-shadow-sm ${pending > 0 ? "text-orange-400" : "text-white"}`}>
              {pending}
            </div>
          </div>
        </div>
        
        <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl hover:bg-white/[0.05] transition-colors relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-16 h-16 bg-green-500/10 rounded-full blur-2xl -mr-8 -mt-8 group-hover:bg-green-500/20 transition-colors"></div>
          <div className="relative z-10 flex flex-col justify-between h-full gap-2">
            <div className="text-[11px] font-bold uppercase tracking-wider text-t3 flex items-center justify-between">
              Avg progress <span className="text-lg opacity-80">📈</span>
            </div>
            <div className="text-3xl font-black text-white tabular-nums drop-shadow-sm flex items-end gap-1">
              {analytics.avgTrackCompletion}<span className="text-lg text-t3 mb-1">%</span>
            </div>
          </div>
        </div>
        
        <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl hover:bg-white/[0.05] transition-colors relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-16 h-16 bg-red-500/10 rounded-full blur-2xl -mr-8 -mt-8 group-hover:bg-red-500/20 transition-colors"></div>
          <div className="relative z-10 flex flex-col justify-between h-full gap-2">
            <div className="text-[11px] font-bold uppercase tracking-wider text-t3 flex items-center justify-between">
              At-risk (flagged) <span className="text-lg opacity-80">⚠️</span>
            </div>
            <div className={`text-3xl font-black tabular-nums drop-shadow-sm ${analytics.atRisk.length > 0 ? "text-red-400" : "text-white"}`}>
              {analytics.atRisk.length}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 backdrop-blur-md">
          <h2 className="text-sm font-bold text-t1 mb-4 flex items-center gap-2 uppercase tracking-wider">
            <span className="text-indigo-400">📅</span> Next deadline
          </h2>
          {nextDeadline ? (
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
              <div className="font-bold text-white text-lg mb-1 truncate">
                {nextDeadline.title}
              </div>
              <div className="text-sm text-indigo-300 font-medium">Due {fmtShort(nextDeadline.dueAt)}</div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl border border-dashed border-white/10 text-center">
              <p className="text-sm text-t3">
                No upcoming due dates, or all assignments are past due.
              </p>
            </div>
          )}
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={`/teach/course/${encodeURIComponent(slug)}/assignments`}
              className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg flex items-center gap-2 ${
                pending > 0 
                  ? "bg-gradient-to-r from-orange-500 to-red-500 text-white hover:scale-105 shadow-orange-500/25" 
                  : "bg-indigo-500/20 text-indigo-300 hover:text-white hover:bg-indigo-500/30 border border-indigo-500/30"
              }`}
            >
              {pending > 0 ? `Grade (${pending} waiting)` : "Open assignments"}
            </Link>
          </div>
        </div>
        
        <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 backdrop-blur-md">
          <h2 className="text-sm font-bold text-t1 mb-4 flex items-center gap-2 uppercase tracking-wider">
            <span className="text-purple-400">⚡</span> Shortcuts
          </h2>
          <ul className="space-y-2 text-sm font-medium">
            <li>
              <Link href={`/teach/course/${encodeURIComponent(slug)}/roster`} className="flex items-center gap-2 p-3 rounded-xl bg-white/5 hover:bg-white/10 text-t2 hover:text-white transition-colors border border-white/5">
                <span>📋</span> View roster
              </Link>
            </li>
            <li>
              <Link href={`/teach/course/${encodeURIComponent(slug)}/builder`} className="flex items-center gap-2 p-3 rounded-xl bg-white/5 hover:bg-white/10 text-t2 hover:text-white transition-colors border border-white/5">
                <span>🏗️</span> Edit content &amp; videos
              </Link>
            </li>
            <li>
              <Link href={`/tracks/${encodeURIComponent(slug)}/messages`} className="flex items-center gap-2 p-3 rounded-xl bg-white/5 hover:bg-white/10 text-t2 hover:text-white transition-colors border border-white/5">
                <span>💬</span> Message students
              </Link>
            </li>
            <li>
              <Link href={`/tracks/${encodeURIComponent(slug)}`} className="flex items-center gap-2 p-3 rounded-xl bg-white/5 hover:bg-white/10 text-t2 hover:text-white transition-colors border border-white/5">
                <span>👀</span> Preview as learner
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
