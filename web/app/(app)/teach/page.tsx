import Link from "next/link";
import { requireVerifiedUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ensureTracksFromDatabase } from "@/lib/course/ensure-tracks";
import { buildTeacherDashboard } from "@/lib/services/teacher-dashboard";
import { TeacherAIInsights } from "@/components/teacher/teacher-ai-insights";
import { TeacherAnalyticsChart } from "@/components/teacher/teacher-analytics-chart";
import { TeacherHeatmap } from "@/components/teacher/teacher-heatmap";
import { Avatar } from "@/components/ui/avatar";

export const dynamic = "force-dynamic";

function fmtDue(ms: number) {
  return new Date(ms).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function fmtAct(ms: number) {
  return new Date(ms).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export default async function TeachDashboardPage() {
  const user = await requireVerifiedUser();
  if (user.role !== "teacher" && user.role !== "admin") redirect("/dashboard");
  await ensureTracksFromDatabase();
  const dash = await buildTeacherDashboard(user.id);

  const uniqueLearners = dash.studentRoster.length;

  return (
    <div className="section-pad-x py-8 w-full text-t1 min-h-screen bg-gradient-to-br from-[#0a0a0f] to-[#12121a]">
      {/* Dynamic Floating Background Orbs */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] bg-indigo-600/10 rounded-full blur-[120px] mix-blend-screen animate-pulse" style={{ animationDuration: '10s' }} />
        <div className="absolute bottom-[-10%] right-[-10%] w-[30vw] h-[30vw] bg-purple-600/10 rounded-full blur-[100px] mix-blend-screen animate-pulse" style={{ animationDuration: '15s' }} />
      </div>

      <div className="max-w-[1400px] mx-auto relative z-10 space-y-6">
        
        {/* Modern Header Bar */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-3">
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></span>
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400">SkillRise Teach Portal</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-white via-white/90 to-white/60 bg-clip-text text-transparent">
              Hello, {user.name.split(" ")[0]}
            </h1>
            <p className="text-t2 mt-2 max-w-xl text-sm leading-relaxed">
              <strong className="text-white">{uniqueLearners}</strong> unique learners across your courses — real people
              enrolled in your tracks.
            </p>
          </div>
          
          <div className="flex items-center gap-3 bg-white/5 p-2 rounded-2xl border border-white/10 backdrop-blur-xl">
            <Link href="/teach/courses" className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-semibold transition-all hover:scale-105 active:scale-95 flex items-center gap-2">
              <span>+</span> New Course
            </Link>
            <Link href="/teach/live" className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white text-sm font-bold transition-all hover:scale-105 active:scale-95 shadow-lg shadow-indigo-500/25 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span> Go Live
            </Link>
          </div>
        </header>

        {dash.studentRoster.length > 0 ? (
          <section className="rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-xl p-5 md:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-400">Your students</div>
                <p className="text-[13px] text-t2 mt-1">
                  Profiles from enrollments — photos appear when learners sign in with Google or GitHub.
                </p>
              </div>
              <Link
                href="/teach/students"
                className="text-[13px] font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                Open roster →
              </Link>
            </div>
            <div className="flex flex-wrap gap-2 md:gap-3">
              {dash.studentRoster.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center gap-2 rounded-2xl bg-white/[0.04] border border-white/10 px-3 py-2"
                  title={s.name}
                >
                  <Avatar spec={s.avatar} photoUrl={s.avatarUrl} name={s.name} size={44} />
                  <span className="text-[13px] font-semibold text-white truncate max-w-[100px] md:max-w-[140px]">
                    {s.name.split(" ")[0]}
                  </span>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {/* BENTO GRID LAYOUT */}
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-12 gap-6">
          
          {/* Key Metrics - spans 3 columns out of 12 */}
          <div className="lg:col-span-3 space-y-6">
            <div className="p-6 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-xl hover:bg-white/[0.05] transition-colors relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-150"></div>
              <h3 className="text-[12px] font-bold uppercase tracking-wider text-t3 mb-4">To Grade</h3>
              <div className="flex items-baseline gap-3">
                <span className="text-6xl font-black tabular-nums tracking-tighter text-white">{dash.pendingGradesTotal}</span>
                <span className="text-sm font-medium text-red-400 bg-red-400/10 px-2 py-1 rounded-lg">Action needed</span>
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-xl hover:bg-white/[0.05] transition-colors relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-150"></div>
              <h3 className="text-[12px] font-bold uppercase tracking-wider text-t3 mb-4">Active Content</h3>
              <div className="flex items-baseline gap-3">
                <span className="text-6xl font-black tabular-nums tracking-tighter text-white">{dash.courseSummaries.length}</span>
                <span className="text-sm font-medium text-t2">Courses</span>
              </div>
              <Link href="/teach/courses" className="mt-4 block text-[13px] text-indigo-400 font-semibold hover:text-indigo-300 transition-colors">Manage Content →</Link>
            </div>
            
            <div className="p-6 rounded-3xl bg-gradient-to-br from-indigo-500/20 to-purple-500/10 border border-indigo-500/30 backdrop-blur-xl">
              <h3 className="text-[12px] font-bold uppercase tracking-wider text-indigo-300 mb-4">Largest course</h3>
              {dash.courseSummaries.length > 0 ? (
                (() => {
                  const topCourse = [...dash.courseSummaries].sort((a, b) => b.enrolled - a.enrolled)[0];
                  return (
                    <>
                      <div className="text-lg font-bold text-white mb-3 truncate">{topCourse.title}</div>
                      <div className="space-y-2 text-sm text-t2">
                        <div>
                          <span className="text-white font-semibold">{topCourse.enrolled}</span> learners enrolled
                        </div>
                        <div>
                          <span className="text-white font-semibold">{topCourse.pendingGrades}</span> submissions waiting
                          for grades
                        </div>
                      </div>
                      <Link
                        href={`/teach/course/${topCourse.slug}`}
                        className="mt-4 inline-block text-[13px] text-indigo-300 font-semibold hover:text-white transition-colors"
                      >
                        Open course →
                      </Link>
                    </>
                  );
                })()
              ) : (
                <p className="text-sm text-indigo-300/60 italic">Publish a course to see enrollment stats.</p>
              )}
            </div>
          </div>

          {/* Center Analytics & Heatmap - spans 6 columns out of 12 */}
          <div className="lg:col-span-6 space-y-6 flex flex-col">
            <div className="p-6 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-xl flex-1 flex flex-col min-h-[300px]">
              <TeacherAnalyticsChart data={dash.chartData} />
            </div>
            
            <div className="p-6 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-xl min-h-[260px]">
              <TeacherHeatmap data={dash.heatmapData} />
            </div>
          </div>

          {/* Right Column: AI & Deadlines - spans 3 columns out of 12 */}
          <div className="lg:col-span-3 space-y-6 flex flex-col">
            <div className="p-6 rounded-3xl bg-gradient-to-br from-blue-900/40 to-indigo-900/20 border border-blue-500/20 backdrop-blur-xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20 mix-blend-overlay"></div>
              <TeacherAIInsights pendingGradesTotal={dash.pendingGradesTotal} />
            </div>

            <div className="p-6 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-xl flex-1">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-[14px] font-bold text-white">Upcoming Deadlines</h2>
                <span className="text-[10px] font-bold text-t3 bg-white/10 px-2 py-1 rounded-full">{dash.upcomingDeadlines.length}</span>
              </div>
              
              {dash.upcomingDeadlines.length === 0 ? (
                <div className="h-[150px] flex items-center justify-center border border-dashed border-white/10 rounded-2xl">
                  <p className="text-[13px] text-t3 italic">All clear. No deadlines.</p>
                </div>
              ) : (
                <ul className="space-y-4">
                  {dash.upcomingDeadlines.slice(0, 4).map((d) => (
                    <li key={`${d.trackSlug}-${d.assignmentId}`} className="group flex gap-3 p-3 rounded-2xl hover:bg-white/[0.04] transition-colors -mx-3 cursor-pointer">
                      <div className="w-10 h-10 rounded-xl bg-white/[0.05] border border-white/10 flex flex-col items-center justify-center shrink-0">
                        <span className="text-[10px] font-bold text-t3 uppercase leading-none">{new Date(d.dueAt).toLocaleDateString(undefined, { month: "short" })}</span>
                        <span className="text-sm font-black text-white leading-none mt-1">{new Date(d.dueAt).getDate()}</span>
                      </div>
                      <div className="min-w-0 flex-1 flex flex-col justify-center">
                        <div className="text-[13px] font-bold text-white group-hover:text-indigo-400 transition-colors truncate">{d.title}</div>
                        <div className="text-[11px] text-t3 truncate mt-0.5">{d.trackTitle}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          
          {/* Bottom Row: Recent Submissions - spans all 12 columns */}
          <div className="lg:col-span-12">
            <div className="p-6 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-xl">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-400 text-lg">📝</div>
                  <div>
                    <h2 className="text-[16px] font-bold text-white leading-tight">Recent Submissions</h2>
                    <p className="text-[12px] text-t3 mt-0.5">Latest student work requiring your attention</p>
                  </div>
                </div>
                <Link href="/teach/courses" className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[13px] font-semibold text-white transition-all">
                  Open Grading Desk
                </Link>
              </div>
              
              {dash.recentSubmissions.length === 0 ? (
                <div className="py-12 text-center border border-dashed border-white/10 rounded-2xl bg-white/[0.01]">
                  <p className="text-sm text-t3">Inbox zero! No recent submissions found.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[800px]">
                    <thead>
                      <tr className="text-[11px] font-bold uppercase tracking-wider text-t3 border-b border-white/10">
                        <th className="pb-4 pl-2 font-medium">Student</th>
                        <th className="pb-4 font-medium">Assignment</th>
                        <th className="pb-4 font-medium">Course</th>
                        <th className="pb-4 font-medium">Status</th>
                        <th className="pb-4 pr-2 font-medium text-right">Submitted</th>
                      </tr>
                    </thead>
                    <tbody className="text-[13px]">
                      {dash.recentSubmissions.map((r, i) => (
                        <tr key={`${r.at}-${r.trackSlug}-${i}`} className="border-b border-white/[0.05] last:border-0 hover:bg-white/[0.02] transition-colors group">
                          <td className="py-4 pl-2">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-[11px] font-bold text-white shadow-lg shrink-0 group-hover:scale-110 transition-transform">
                                {r.studentName.charAt(0)}
                              </div>
                              <span className="font-bold text-white">{r.studentName}</span>
                            </div>
                          </td>
                          <td className="py-4 text-t2 font-medium pr-4">{r.assignmentTitle}</td>
                          <td className="py-4 text-t3 truncate max-w-[200px] pr-4">{r.trackTitle}</td>
                          <td className="py-4">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider border
                              ${r.status === 'submitted' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' : 
                                r.status === 'graded' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 
                                'bg-white/5 text-t3 border-white/10'}`}>
                              <span className={`w-1.5 h-1.5 rounded-full mr-2 ${r.status === 'submitted' ? 'bg-yellow-400 animate-pulse' : r.status === 'graded' ? 'bg-green-400' : 'bg-t3'}`}></span>
                              {r.status}
                            </span>
                          </td>
                          <td className="py-4 pr-2 text-right tabular-nums text-t3 shrink-0 whitespace-nowrap">{fmtAct(r.at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
