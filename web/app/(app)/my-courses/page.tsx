import { requireVerifiedUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { getTrack } from "@/lib/store";
import Link from "next/link";
import { ProgressRing } from "@/components/dashboards/progress-ring";
import { ensureTracksFromDatabase } from "@/lib/course/ensure-tracks";

export const dynamic = "force-dynamic";

export default async function MyCoursesPage() {
  const user = await requireVerifiedUser();
  const db = getDb();
  await db.ready();
  await ensureTracksFromDatabase();

  const enrollments = await db.listEnrollments(user.id);

  // Separate active and completed
  const active: any[] = [];
  const completed: any[] = [];

  for (const e of enrollments) {
    const track = getTrack(e.trackSlug);
    if (!track) continue;

    const total = track.modules.length;
    const done = e.completedModuleIds.length;
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
    
    // Determine the next module to learn
    const nextMod = track.modules.find(m => !e.completedModuleIds.includes(m.id)) || track.modules[0];

    const courseData = {
      enrollment: e,
      track,
      pct,
      total,
      done,
      nextMod
    };

    if (pct === 100) {
      completed.push(courseData);
    } else {
      active.push(courseData);
    }
  }

  // Sort active: most recently active first (or just by progress for now)
  active.sort((a, b) => b.pct - a.pct);

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-[36px] font-extrabold text-white leading-tight mb-2" style={{ fontFamily: "var(--role-font-display)" }}>
          My Courses
        </h1>
        <p className="text-[15px] text-white/60">
          Pick up right where you left off.
        </p>
      </div>

      {enrollments.length === 0 ? (
        <div className="rounded-3xl bg-white/[0.02] border border-white/10 backdrop-blur-xl p-12 text-center flex flex-col items-center justify-center">
          <div className="text-[48px] mb-4">📚</div>
          <div className="text-[24px] font-bold mb-2 text-white" style={{ fontFamily: "var(--role-font-display)" }}>
            You haven't enrolled in any courses yet
          </div>
          <p className="text-[15px] mb-6 text-white/60 max-w-sm">
            Browse our catalog of expert-led tracks to start learning today.
          </p>
          <Link href="/tracks" className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold transition-colors shadow-[0_0_20px_rgba(16,185,129,0.3)]">
            Explore Tracks
          </Link>
        </div>
      ) : (
        <div className="space-y-12">
          {active.length > 0 && (
            <section>
              <h2 className="text-[20px] font-bold text-white mb-5 flex items-center gap-2" style={{ fontFamily: "var(--role-font-display)" }}>
                <span className="text-emerald-400">▶</span> Active learning
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {active.map(({ track, pct, nextMod, done, total }) => (
                  <Link
                    key={track.slug}
                    href={`/learn/${track.slug}/${nextMod.id}`}
                    className="rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl overflow-hidden hover:bg-white/[0.05] hover:border-emerald-500/30 transition-all group flex flex-col h-full shadow-lg"
                  >
                    <div 
                      className="aspect-video p-6 flex flex-col justify-end relative overflow-hidden"
                      style={{ background: `linear-gradient(135deg, rgba(${track.color},0.6), rgba(${track.color},0.2))` }}
                    >
                      <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full blur-[40px] -mr-10 -mt-10 pointer-events-none group-hover:bg-white/30 transition-colors"></div>
                      <div className="text-[48px] absolute top-4 right-4 drop-shadow-lg group-hover:scale-110 transition-transform origin-top-right">
                        {track.heroEmoji}
                      </div>
                      <div className="relative z-10">
                        <div className="text-[11px] font-bold uppercase tracking-wider text-white/80 mb-1">
                          {track.level}
                        </div>
                        <h3 className="font-extrabold text-[18px] text-white leading-tight drop-shadow-md line-clamp-2" style={{ fontFamily: "var(--role-font-display)" }}>
                          {track.title}
                        </h3>
                      </div>
                    </div>
                    
                    <div className="p-5 flex flex-col flex-1 gap-4">
                      <div className="flex items-center gap-4">
                        <ProgressRing value={pct} size={48} stroke={4} color="#10b981" />
                        <div className="flex-1 min-w-0">
                          <div className="text-[11px] uppercase tracking-wider text-white/40 mb-0.5">Overall Progress</div>
                          <div className="font-bold text-[14px] text-white truncate">{pct}% Complete</div>
                        </div>
                      </div>
                      
                      <div className="mt-auto">
                        <div className="text-[12px] text-white/50 mb-2 truncate">
                          <strong className="text-white/80">Up next:</strong> {nextMod.title}
                        </div>
                        <div className="w-full py-2.5 rounded-xl bg-white/5 border border-white/10 text-center font-bold text-[13px] text-white group-hover:bg-emerald-500 group-hover:text-white group-hover:border-emerald-400 transition-colors">
                          Continue Learning
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {completed.length > 0 && (
            <section>
              <h2 className="text-[20px] font-bold text-white mb-5 flex items-center gap-2" style={{ fontFamily: "var(--role-font-display)" }}>
                <span className="text-amber-400">🏆</span> Completed
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {completed.map(({ track, enrollment }) => (
                  <Link
                    key={track.slug}
                    href={`/tracks/${track.slug}`}
                    className="rounded-2xl bg-white/[0.02] border border-white/5 backdrop-blur-xl overflow-hidden hover:bg-white/[0.04] hover:border-white/20 transition-all group flex flex-col h-full"
                  >
                    <div className="p-4 flex gap-4 items-center border-b border-white/5 relative overflow-hidden">
                      <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ background: `linear-gradient(to right, rgba(${track.color},1), transparent)` }}></div>
                      <div className="w-12 h-12 rounded-full flex items-center justify-center text-[24px] bg-black/40 border border-white/10 relative z-10">
                        {track.heroEmoji}
                      </div>
                      <div className="flex-1 min-w-0 relative z-10">
                        <h3 className="font-bold text-[15px] text-white leading-tight truncate" style={{ fontFamily: "var(--role-font-display)" }}>
                          {track.title}
                        </h3>
                        <div className="text-[11px] text-emerald-400 flex items-center gap-1 mt-0.5">
                          ✓ Completed
                        </div>
                      </div>
                    </div>
                    <div className="p-4 flex gap-2">
                      <div className="flex-1 py-2 text-center rounded-lg bg-white/5 text-[12px] font-medium text-white/70 hover:bg-white/10 transition-colors border border-transparent hover:border-white/10">
                        Review Course
                      </div>
                      <Link href={`/cert`} className="flex-1 py-2 text-center rounded-lg bg-amber-500/10 text-[12px] font-bold text-amber-400 hover:bg-amber-500/20 transition-colors border border-amber-500/20 hover:border-amber-500/40">
                        Certificate
                      </Link>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
