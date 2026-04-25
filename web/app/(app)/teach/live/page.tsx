import Link from "next/link";
import { requireVerifiedUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { store } from "@/lib/store";
import { ScheduleLiveForm } from "@/components/schedule-live-form";

export const dynamic = "force-dynamic";

export default async function ScheduleLivePage() {
  const user = await requireVerifiedUser();
  if (user.role !== "teacher" && user.role !== "admin") redirect("/dashboard");
  const myLive = store.liveSessions.filter((l) => l.teacherId === user.id).sort((a, b) => a.startsAt - b.startsAt);

  return (
    <div className="w-full text-t1 min-h-screen bg-[#050508] pb-12 relative overflow-hidden">
      {/* Background Effect - "On Air" vibe */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[10%] right-[10%] w-[30vw] h-[30vw] bg-red-600/10 rounded-full blur-[150px] mix-blend-screen animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-[10%] left-[10%] w-[40vw] h-[40vw] bg-indigo-600/5 rounded-full blur-[150px] mix-blend-screen animate-pulse" style={{ animationDuration: '12s' }} />
      </div>

      <div className="max-w-[1400px] mx-auto relative z-10 px-4 sm:px-6 md:px-8 pt-8">
        <div className="mb-6">
          <Link href="/teach" className="inline-flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300 font-bold transition-colors bg-white/5 hover:bg-white/10 border border-white/5 px-3 py-1.5 rounded-lg backdrop-blur-md">
            <span>←</span> Back to Dashboard
          </Link>
        </div>
        
        <header className="mb-10 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 mb-3">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
              <span className="text-[11px] font-bold uppercase tracking-wider text-red-400">Live Kit Integration</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-white via-white/90 to-white/60 bg-clip-text text-transparent mb-3">
              Broadcast Control Room
            </h1>
            <p className="text-t2 max-w-2xl text-sm leading-relaxed">
              Schedule interactive live sessions. We handle the infrastructure. Leverage the <strong className="text-white">Optimal Scheduling Algorithm</strong> to maximize student attendance.
            </p>
          </div>
        </header>

        <div className="mb-12">
          <ScheduleLiveForm />
        </div>

        {/* Existing Sessions */}
        <div>
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
            <span>📡</span> Scheduled Broadcasts
          </h2>
          
          {myLive.length === 0 ? (
            <div className="p-10 text-center rounded-3xl bg-white/[0.02] border border-dashed border-white/10 backdrop-blur-md">
              <div className="text-3xl mb-3 opacity-50">📆</div>
              <p className="text-sm text-t3">No upcoming live sessions scheduled.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {myLive.map((l) => (
                <div key={l.id} className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-md hover:bg-white/[0.05] transition-colors relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-500/10 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-indigo-500/20 transition-colors"></div>
                  
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        {l.status === "ended" ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-white/10 text-t3">Ended</span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-green-500/20 text-green-400 border border-green-500/30 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
                            Upcoming
                          </span>
                        )}
                        {l.youth && <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30">Youth Zone</span>}
                      </div>
                    </div>
                    
                    <h3 className="text-lg font-bold text-white mb-1 leading-tight">{l.title}</h3>
                    <div className="text-xs text-indigo-400 font-semibold mb-4">{new Date(l.startsAt).toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</div>
                    
                    <div className="flex items-center gap-4 pt-4 border-t border-white/10">
                      <div className="flex items-center gap-1.5 text-xs text-t2 font-medium">
                        <span>⏱️</span> {l.durationMin} min
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-t2 font-medium">
                        <span>👥</span> {l.attendees.length} RSVPs
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
