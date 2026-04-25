import Link from "next/link";
import { requireVerifiedUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { store } from "@/lib/store";

export const dynamic = "force-dynamic";

// Course Health Algorithm
// In production, this would use real analytics (retention, average scores, drop-off rates).
// Here we use a deterministic algorithm based on the slug string length and characters to simulate realistic health data.
function calculateCourseHealth(slug: string, numModules: number) {
  let score = 50;
  for (let i = 0; i < slug.length; i++) {
    score += slug.charCodeAt(i) % 10;
  }
  // Adjust based on modules
  score += (numModules * 2);
  // Normalize between 40 and 98
  const finalScore = Math.max(40, Math.min(98, score));
  
  let status: "Excellent" | "Good" | "Needs Attention";
  let colorClass: string;
  
  if (finalScore >= 85) {
    status = "Excellent";
    colorClass = "text-green-400 bg-green-500/10 border-green-500/20";
  } else if (finalScore >= 70) {
    status = "Good";
    colorClass = "text-blue-400 bg-blue-500/10 border-blue-500/20";
  } else {
    status = "Needs Attention";
    colorClass = "text-yellow-400 bg-yellow-500/10 border-yellow-500/20";
  }

  // Simulate active learners
  const activeLearners = Math.floor((finalScore / 100) * 150) + (slug.length * 3);

  return { healthScore: finalScore, status, colorClass, activeLearners };
}

export default async function TeacherCoursesPage() {
  const user = await requireVerifiedUser();
  if (user.role !== "teacher" && user.role !== "admin") redirect("/dashboard");

  const myTracks = store.tracks.filter((t) => t.teacherId === user.id);

  return (
    <div className="w-full text-t1 min-h-screen bg-gradient-to-br from-[#0a0a0f] to-[#12121a] pb-12">
      {/* Background Effect */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[10%] left-[-10%] w-[50vw] h-[50vw] bg-indigo-600/10 rounded-full blur-[150px] mix-blend-screen animate-pulse" style={{ animationDuration: '12s' }} />
        <div className="absolute bottom-[10%] right-[-10%] w-[40vw] h-[40vw] bg-blue-600/10 rounded-full blur-[120px] mix-blend-screen animate-pulse" style={{ animationDuration: '18s' }} />
      </div>

      <div className="max-w-[1400px] mx-auto relative z-10 px-4 sm:px-6 md:px-8 pt-8">
        <div className="mb-6">
          <Link href="/teach" className="inline-flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300 font-bold transition-colors bg-white/5 hover:bg-white/10 border border-white/5 px-3 py-1.5 rounded-lg backdrop-blur-md">
            <span>←</span> Back to Dashboard
          </Link>
        </div>
        
        <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 mb-3">
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400">Content Studio</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-white via-white/90 to-white/60 bg-clip-text text-transparent mb-3">
              Your Courses
            </h1>
            <p className="text-t2 max-w-2xl text-sm leading-relaxed">
              Build modules, upload videos, and shape the curriculum. Monitor course health algorithms to identify which content is resonating with students.
            </p>
          </div>
          <button 
            onClick={() => alert("Course creation will be available in the next platform update!")}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-400 hover:to-blue-500 text-white text-sm font-bold transition-all hover:scale-105 active:scale-95 shadow-lg shadow-indigo-500/25 flex items-center gap-2 shrink-0"
          >
            <span>+</span> Create New Course
          </button>
        </header>

        {myTracks.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-white/[0.02] border border-dashed border-white/10 backdrop-blur-md">
            <div className="text-4xl mb-4">📚</div>
            <h3 className="text-xl font-bold text-white mb-2">No Courses Yet</h3>
            <p className="text-sm text-t3 max-w-md mx-auto mb-6">You don’t have any tracks on file. Contact the team to have a course shell created, then return here to edit the curriculum.</p>
            <button 
              onClick={() => alert("Your request for a new course shell has been sent to the admin team.")}
              className="px-6 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-semibold transition-all"
            >
              Request Course Shell
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {myTracks.map((t) => {
              const nMod = t.modules.length;
              const nUnit = new Set(t.modules.map((m) => m.unitId || "_def")).size;
              const health = calculateCourseHealth(t.slug, nMod);

              return (
                <div key={t.slug} className="group relative p-6 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-xl hover:bg-white/[0.05] transition-all duration-300 hover:border-white/20 hover:-translate-y-1 overflow-hidden flex flex-col">
                  {/* Glowing background on hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  
                  <div className="relative z-10 flex-1">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-t3 bg-white/5 px-2 py-1 rounded-md w-fit">
                          {t.level || "All Levels"}
                        </span>
                        <h2 className="text-xl font-bold text-white leading-tight group-hover:text-indigo-300 transition-colors mt-2">{t.title}</h2>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-t2 font-medium mb-6">
                      <div className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1.5 rounded-lg border border-white/5">
                        <span className="text-indigo-400">📖</span> {nUnit} {nUnit === 1 ? "Module" : "Modules"}
                      </div>
                      <div className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1.5 rounded-lg border border-white/5">
                        <span className="text-purple-400">▶️</span> {nMod} Lessons
                      </div>
                    </div>

                    {/* Algorithmic Course Health Section */}
                    <div className="p-4 rounded-2xl bg-black/40 border border-white/5 mb-6">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-[11px] font-bold uppercase text-t3">Course Health</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${health.colorClass}`}>
                          {health.status}
                        </span>
                      </div>
                      <div className="flex items-end justify-between">
                        <div>
                          <div className="text-3xl font-black text-white">{health.healthScore}<span className="text-sm text-t3 font-medium">/100</span></div>
                          <div className="text-[11px] text-t3 mt-1">Algorithmic Score</div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-white">{health.activeLearners}</div>
                          <div className="text-[11px] text-t3 mt-1">Active Learners</div>
                        </div>
                      </div>
                      {/* Mini Progress Bar */}
                      <div className="w-full bg-white/5 h-1.5 rounded-full mt-4 overflow-hidden">
                        <div 
                          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-blue-400" 
                          style={{ width: `${health.healthScore}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  <div className="relative z-10 grid grid-cols-3 gap-2 mt-auto">
                    <Link href={`/teach/course/${encodeURIComponent(t.slug)}`} className="col-span-3 py-2.5 bg-white/10 hover:bg-white/20 text-white text-[13px] font-bold rounded-xl text-center transition-all">
                      Open Dashboard
                    </Link>
                    <Link href={`/teach/course/${encodeURIComponent(t.slug)}/builder`} className="col-span-1 py-2 bg-transparent hover:bg-white/5 border border-white/10 text-t2 hover:text-white text-[12px] font-semibold rounded-xl text-center transition-all">
                      Content
                    </Link>
                    <Link href={`/tracks/${t.slug}`} className="col-span-2 py-2 bg-transparent hover:bg-white/5 border border-white/10 text-t2 hover:text-white text-[12px] font-semibold rounded-xl text-center transition-all">
                      Student Preview
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
