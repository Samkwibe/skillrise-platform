import { notFound, redirect } from "next/navigation";
import { requireVerifiedUser } from "@/lib/auth";
import { getTrack } from "@/lib/store";
import { canTeacherEditCourse } from "@/lib/services/teacher-course";
import { buildCourseAnalytics } from "@/lib/services/course-analytics";
import { ensureTracksFromDatabase } from "@/lib/course/ensure-tracks";
import { CourseAnalyticsCharts } from "@/components/teacher/course-analytics-charts";

export const dynamic = "force-dynamic";

export default async function TeacherCourseAnalyticsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await requireVerifiedUser();
  if (user.role !== "teacher" && user.role !== "admin") redirect("/dashboard");
  await ensureTracksFromDatabase();
  const track = getTrack(slug);
  if (!canTeacherEditCourse(user, track) || !track) notFound();
  const data = await buildCourseAnalytics(track, user.id);
  const chartPayload = {
    enrollCount: data.enrollCount,
    graduated: data.graduated,
    avgTrackCompletion: data.avgTrackCompletion,
    moduleCompletion: data.moduleCompletion,
    quizAverages: data.quizAverages,
    atRiskCount: data.atRisk.length,
  };

  return (
    <div className="w-full animate-in fade-in duration-500">
      <h2 className="text-2xl font-extrabold mb-1 text-white flex items-center gap-2">
        <span className="text-green-400">📊</span> Course Analytics
      </h2>
      <p className="text-sm mb-8 text-t2 font-medium">
        Deep dive into <span className="text-white">{data.title}</span> performance.
      </p>
      
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/10 rounded-full blur-2xl -mr-8 -mt-8 group-hover:bg-blue-500/20 transition-colors"></div>
          <div className="text-t3 text-[11px] font-bold tracking-wider uppercase mb-2">Enrolled</div>
          <div className="text-3xl font-black text-white">{data.enrollCount}</div>
        </div>
        <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-16 h-16 bg-purple-500/10 rounded-full blur-2xl -mr-8 -mt-8 group-hover:bg-purple-500/20 transition-colors"></div>
          <div className="text-t3 text-[11px] font-bold tracking-wider uppercase mb-2">Graduated</div>
          <div className="text-3xl font-black text-white">{data.graduated}</div>
        </div>
        <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-16 h-16 bg-green-500/10 rounded-full blur-2xl -mr-8 -mt-8 group-hover:bg-green-500/20 transition-colors"></div>
          <div className="text-t3 text-[11px] font-bold tracking-wider uppercase mb-2">Avg completion</div>
          <div className="text-3xl font-black text-white flex items-end gap-1">{data.avgTrackCompletion}<span className="text-lg text-t3 mb-1">%</span></div>
        </div>
        <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-16 h-16 bg-red-500/10 rounded-full blur-2xl -mr-8 -mt-8 group-hover:bg-red-500/20 transition-colors"></div>
          <div className="text-t3 text-[11px] font-bold tracking-wider uppercase mb-2">At-risk (heuristic)</div>
          <div className={`text-3xl font-black ${data.atRisk.length > 0 ? "text-red-400" : "text-white"}`}>{data.atRisk.length}</div>
        </div>
      </div>

      <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 backdrop-blur-md mb-10">
        <CourseAnalyticsCharts data={chartPayload} />
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 backdrop-blur-md">
          <h2 className="font-bold text-lg mb-4 text-white flex items-center gap-2">
            <span className="text-indigo-400">📝</span> Quiz Performance
          </h2>
          <ul className="text-sm space-y-3">
            {data.quizAverages.map((q) => (
              <li key={q.quizId} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                <div className="font-medium text-t1">{q.title}</div>
                <div className="text-right">
                  <div className="font-bold text-white">{q.averagePct != null ? `${q.averagePct}%` : "—"}</div>
                  <div className="text-[10px] text-t3">{q.studentsWithScore} students</div>
                </div>
              </li>
            ))}
            {data.quizAverages.length === 0 && (
              <li className="text-t3 italic p-4 text-center border border-dashed border-white/10 rounded-xl">No quizzes linked to this course key yet.</li>
            )}
          </ul>
        </div>

        <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 backdrop-blur-md">
          <h2 className="font-bold text-lg mb-4 text-white flex items-center gap-2">
            <span className="text-red-400">⚠️</span> At-risk detail
          </h2>
          {data.atRisk.length === 0 && (
            <div className="p-4 rounded-xl border border-dashed border-white/10 text-center">
              <p className="text-t2 text-sm">No flags for this class right now. Great job!</p>
            </div>
          )}
          <ul className="space-y-3">
            {data.atRisk.map((r) => (
              <li key={r.userId} className="p-4 rounded-xl bg-red-500/5 border border-red-500/20 text-sm text-t2">
                <div className="font-bold text-white mb-2">{r.name}</div>
                <ul className="list-disc pl-4 space-y-1 text-red-200/70">
                  {r.reasons.map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
