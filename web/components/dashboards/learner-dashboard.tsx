import Link from "next/link";
import type { User } from "@/lib/store";
import {
  store,
  userEnrollments,
  userCertificates,
  getTrack,
  findUserById,
  recommendTracksFor,
  STRUGGLE_OPTIONS,
  LIFE_CATEGORIES,
} from "@/lib/store";
import { ProgressRing } from "./progress-ring";
import { WeeklyGoal } from "./weekly-goal";
import { SkillSearch } from "@/components/dashboard/skill-search";
import { UnifiedCourseSearch } from "@/components/courses/unified-course-search";
import {
  ContinueExternalCourses,
  LearnerCoursesDock,
  RecommendedFreeCourses,
} from "@/components/courses/learner-courses-dock";
import { LearnerHeatmap } from "@/components/learner/learner-heatmap";
import { LearnerAIWidget } from "@/components/learner/learner-ai-widget";
import { LearnerAchievements } from "@/components/learner/learner-achievements";

/**
 * Learner dashboard — Redesigned with premium command-center aesthetic.
 * Layout: Asymmetrical grid with Main column for active tracks/heatmap 
 * and Right rail for AI Tutor, Achievements, and Live Sessions.
 */
export function LearnerDashboard({ user }: { user: User }) {
  const enrolls = userEnrollments(user.id);
  const certs = userCertificates(user.id);
  const totalModules = enrolls.reduce(
    (s, e) => s + (getTrack(e.trackSlug)?.modules.length ?? 0),
    0,
  );
  const completedModules = enrolls.reduce((s, e) => s + e.completedModuleIds.length, 0);
  const completionPct =
    totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;

  const primary = enrolls.find(
    (e) => (getTrack(e.trackSlug)?.modules.length ?? 0) > e.completedModuleIds.length,
  );
  const primaryTrack = primary ? getTrack(primary.trackSlug) : null;
  const primaryNext = primaryTrack?.modules.find(
    (m) => !primary!.completedModuleIds.includes(m.id),
  );
  const primaryPct = primary && primaryTrack
    ? Math.round((primary.completedModuleIds.length / primaryTrack.modules.length) * 100)
    : 0;

  const personalized = recommendTracksFor(user).filter(
    (t) => !enrolls.some((e) => e.trackSlug === t.slug),
  );
  const struggleLabels = (user.onboarding?.struggles ?? [])
    .map((id) => STRUGGLE_OPTIONS.find((s) => s.id === id)?.label)
    .filter((s): s is string => Boolean(s));
  const recommended = (personalized.length > 0 ? personalized : store.tracks)
    .filter((t) => !enrolls.some((e) => e.trackSlug === t.slug))
    .slice(0, 3);

  const jobsForYou = store.jobs
    .filter((j) => j.neighborhood === user.neighborhood)
    .slice(0, 3);

  const upcomingLive = store.liveSessions
    .filter((l) => l.status === "scheduled")
    .sort((a, b) => a.startsAt - b.startsAt)
    .slice(0, 2);

  return (
    <div className="animate-in fade-in duration-500 pb-12 text-white">
      {/* Hero row: Next module cover card + stats ring */}
      <div className="grid lg:grid-cols-[2fr_1fr] gap-4 md:gap-6 mb-6 md:mb-8">
        {primary && primaryTrack && primaryNext ? (
          <Link
            href={`/learn/${primaryTrack.slug}/${primaryNext.id}`}
            className="p-0 rounded-3xl bg-white/[0.02] border border-white/10 backdrop-blur-xl relative overflow-hidden group hover:bg-white/[0.04] transition-all shadow-[0_8px_30px_rgba(0,0,0,0.4)] flex flex-col"
          >
            <div
              className="flex-1 relative flex items-end p-6 md:p-8 overflow-hidden"
              style={{
                background: `linear-gradient(135deg, rgba(${primaryTrack.color},0.8), rgba(${primaryTrack.color},0.2))`,
              }}
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full blur-[80px] -mr-20 -mt-20 group-hover:bg-white/30 transition-colors pointer-events-none"></div>
              
              <div className="absolute top-6 left-6 md:left-8 text-[11px] font-bold uppercase tracking-[0.14em] text-white/80">
                Continue where you left off
              </div>
              <div className="absolute top-6 right-6 md:right-8 text-[64px] opacity-80 group-hover:scale-110 transition-transform duration-500 origin-top-right drop-shadow-2xl">{primaryTrack.heroEmoji}</div>
              
              <div className="relative z-10 mt-12 w-full">
                <div
                  className="text-[28px] md:text-[36px] font-extrabold leading-[1.1] text-white drop-shadow-md mb-2 line-clamp-2"
                  style={{ fontFamily: "var(--role-font-display)", letterSpacing: "-0.01em" }}
                >
                  {primaryTrack.title}
                </div>
                <div className="flex items-center gap-2 text-white/90 text-[14px] font-medium bg-black/20 w-fit px-3 py-1.5 rounded-lg backdrop-blur-md border border-white/10">
                  <span className="text-emerald-400">▶</span> Next: {primaryNext.title} <span className="opacity-50">· {primaryNext.duration}</span>
                </div>
              </div>
            </div>
            
            <div className="p-5 md:p-6 flex items-center justify-between gap-4 bg-black/40 backdrop-blur-xl border-t border-white/10">
              <div className="flex items-center gap-4 flex-1">
                <div className="h-2 flex-1 max-w-[300px] bg-white/10 rounded-full overflow-hidden shadow-inner">
                  <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]" style={{ width: `${primaryPct}%` }} />
                </div>
                <div className="font-mono text-[13px] text-white/60 font-medium">
                  {primary.completedModuleIds.length}/{primaryTrack.modules.length} modules
                </div>
              </div>
              <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-[14px] group-hover:bg-white/90 group-hover:scale-105 transition-all bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.15)]">
                Resume <span className="group-hover:translate-x-1 transition-transform">→</span>
              </span>
            </div>
          </Link>
        ) : (
          <div className="rounded-3xl bg-white/[0.02] border border-white/10 backdrop-blur-xl p-8 md:p-12 text-center flex flex-col items-center justify-center relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent"></div>
            <div className="text-[48px] mb-4 relative z-10 group-hover:scale-110 transition-transform duration-500">🧭</div>
            <div className="text-[24px] font-bold mb-2 text-white relative z-10" style={{ fontFamily: "var(--role-font-display)" }}>Pick your first track</div>
            <div className="text-[15px] mb-6 text-white/60 max-w-sm relative z-10">
              Most learners finish their first module within a day.
            </div>
            <Link href="/tracks" className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold transition-colors shadow-[0_0_20px_rgba(16,185,129,0.3)] relative z-10">
              Browse tracks
            </Link>
          </div>
        )}

        <div className="rounded-3xl bg-white/[0.02] border border-white/10 backdrop-blur-xl p-6 md:p-8 flex flex-col items-center justify-center gap-2 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5"></div>
          <div className="relative z-10">
            <ProgressRing
              value={completionPct}
              size={160}
              stroke={14}
              color="#3b82f6" // blue-500
              sublabel="overall"
            />
          </div>
          <div className="flex items-center gap-6 mt-6 text-[12px] text-white/60 relative z-10 bg-black/20 p-4 rounded-2xl border border-white/5 w-full justify-center">
            <div className="flex flex-col items-center">
              <div className="font-extrabold text-[22px] text-white" style={{ fontFamily: "var(--role-font-display)" }}>
                {enrolls.length}
              </div>
              <div className="uppercase tracking-wider text-[10px] mt-0.5">Tracks</div>
            </div>
            <div className="w-px h-10 bg-white/10" />
            <div className="flex flex-col items-center">
              <div className="font-extrabold text-[22px] text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.3)]" style={{ fontFamily: "var(--role-font-display)" }}>
                {certs.length}
              </div>
              <div className="uppercase tracking-wider text-[10px] mt-0.5">Certificates</div>
            </div>
            <div className="w-px h-10 bg-white/10" />
            <div className="flex flex-col items-center">
              <div className="font-extrabold text-[22px] text-emerald-400" style={{ fontFamily: "var(--role-font-display)" }}>
                {completedModules}
              </div>
              <div className="uppercase tracking-wider text-[10px] mt-0.5">Lessons</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Column (Tracks, Heatmap) / Right Column (AI, Achievements, Live) */}
      <div className="grid lg:grid-cols-[1fr_340px] 3xl:grid-cols-[1fr_400px] gap-6">
        
        {/* LEFT COLUMN */}
        <div className="space-y-6">
          
          <LearnerHeatmap user={user} />
          
          <WeeklyGoal user={user} />

          {/* Because you said... Block */}
          {personalized.length > 0 ? (
            <section className="rounded-3xl bg-white/[0.02] border border-emerald-500/20 backdrop-blur-xl p-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/10 to-transparent pointer-events-none"></div>
              <div className="relative z-10">
                <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-emerald-400 mb-1 flex items-center gap-1.5">
                      <span>◆</span> Picked for you
                    </div>
                    <h2
                      className="text-[22px] md:text-[26px] font-extrabold text-white"
                      style={{ fontFamily: "var(--role-font-display)", letterSpacing: "-0.01em" }}
                    >
                      {struggleLabels.length > 0
                        ? `Because you said ${struggleLabels.slice(0, 2).join(" & ").toLowerCase()}…`
                        : "Based on what you told us"}
                    </h2>
                    <p className="text-[14px] mt-1 text-white/60">
                      Start small. One video a day beats one marathon and a month of nothing.
                    </p>
                  </div>
                  <Link href="/onboarding" className="text-[13px] text-emerald-400 hover:text-emerald-300 underline transition-colors">
                    Update my answers
                  </Link>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {personalized.slice(0, 3).map((t) => {
                    const cat = LIFE_CATEGORIES.find((c) => c.id === t.category);
                    return (
                      <Link
                        key={t.slug}
                        href={`/tracks/${t.slug}`}
                        className="rounded-2xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] transition-all overflow-hidden flex flex-col group hover:border-emerald-500/30"
                      >
                        <div
                          className="p-4 flex items-start justify-between relative overflow-hidden"
                          style={{
                            background: `linear-gradient(135deg, rgba(${t.color},0.3), rgba(${t.color},0.05))`,
                          }}
                        >
                          <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-10 transition-opacity mix-blend-overlay pointer-events-none"></div>
                          <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/80 relative z-10">
                            {cat?.label ?? "Life skill"}
                          </div>
                          <div className="text-[28px] relative z-10 group-hover:scale-110 transition-transform origin-top-right drop-shadow-md">{t.heroEmoji}</div>
                        </div>
                        <div className="p-4 flex-1 flex flex-col">
                          <div
                            className="font-bold text-[16px] leading-tight mb-2 text-white group-hover:text-emerald-400 transition-colors"
                            style={{ fontFamily: "var(--role-font-display)" }}
                          >
                            {t.title}
                          </div>
                          <div className="text-[13px] text-white/60 flex-1 line-clamp-2">
                            {t.summary}
                          </div>
                          <div className="text-[11px] font-medium mt-4 pt-3 border-t border-white/10 text-white/40 flex items-center justify-between">
                            <span>{t.weeks} wk · {t.modules.length} lessons</span>
                            <span className="bg-white/5 px-2 py-0.5 rounded text-white/60">{(user.onboarding?.timePerDay ?? 15)}m/day</span>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </section>
          ) : !user.onboarding ? (
            <Link
              href="/onboarding"
              className="rounded-3xl p-6 md:p-8 flex items-start md:items-center gap-5 group border border-emerald-500/30 relative overflow-hidden transition-all hover:border-emerald-400/50 shadow-[0_0_30px_rgba(16,185,129,0.1)] hover:shadow-[0_0_40px_rgba(16,185,129,0.2)] bg-gradient-to-r from-emerald-900/40 to-emerald-900/10"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[60px] pointer-events-none group-hover:bg-emerald-500/20 transition-colors"></div>
              <div className="text-[40px] shrink-0 relative z-10 group-hover:scale-110 transition-transform origin-center">👋</div>
              <div className="flex-1 min-w-0 relative z-10">
                <div className="text-[12px] font-bold uppercase tracking-[0.14em] text-emerald-400 mb-1">
                  Take 60 seconds
                </div>
                <div className="text-[20px] md:text-[22px] font-extrabold text-white" style={{ fontFamily: "var(--role-font-display)" }}>
                  Tell us what you're struggling with.
                </div>
                <div className="text-[14px] text-white/70 mt-1">
                  We'll tailor your tracks, your feed, and your job matches. You can skip anything.
                </div>
              </div>
              <span className="hidden md:inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-[14px] group-hover:translate-x-1 transition-transform bg-emerald-500 text-white relative z-10 shadow-lg">
                Start →
              </span>
            </Link>
          ) : null}

          {/* Active Tracks Section */}
          <section>
            <div className="flex items-end justify-between mb-4">
              <h2
                className="text-[24px] font-extrabold text-white"
                style={{ fontFamily: "var(--role-font-display)", letterSpacing: "-0.01em" }}
              >
                Your active tracks
              </h2>
              <Link href="/tracks" className="text-[13px] text-white/60 hover:text-white underline transition-colors">
                Browse all →
              </Link>
            </div>

            {enrolls.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/20 p-8 text-center text-[14px] text-white/50 bg-white/[0.01]">
                No active tracks yet. Browse the catalog to start.
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {enrolls.map((e) => {
                  const t = getTrack(e.trackSlug);
                  if (!t) return null;
                  const pct = Math.round((e.completedModuleIds.length / t.modules.length) * 100);
                  const next = t.modules.find((m) => !e.completedModuleIds.includes(m.id));
                  return (
                    <Link key={e.id} href={`/tracks/${t.slug}`} className="rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] transition-all overflow-hidden flex flex-col group">
                      <div
                        className="h-[80px] p-4 flex items-start justify-between relative overflow-hidden"
                        style={{ background: `linear-gradient(135deg, rgba(${t.color},0.3), rgba(${t.color},0.05))` }}
                      >
                        <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-10 transition-opacity mix-blend-overlay pointer-events-none"></div>
                        <div className="text-[11px] font-bold uppercase tracking-wider text-white/80 relative z-10">
                          {t.level} · {t.weeks} wks
                        </div>
                        <div className="text-[34px] -mt-2 relative z-10 group-hover:scale-110 transition-transform origin-top-right drop-shadow-md">{t.heroEmoji}</div>
                      </div>
                      <div className="p-4 flex gap-4 items-center bg-black/20 backdrop-blur-sm">
                        <ProgressRing value={pct} size={54} stroke={6} color="#10b981" />
                        <div className="min-w-0 flex-1">
                          <div
                            className="font-bold text-[16px] leading-tight truncate text-white group-hover:text-emerald-400 transition-colors"
                            style={{ fontFamily: "var(--role-font-display)" }}
                          >
                            {t.title}
                          </div>
                          <div className="text-[12px] truncate text-white/50 mt-0.5">
                            {next ? `Next: ${next.title}` : "Completed"}
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>
          
          <UnifiedCourseSearch variant="compact" />
          <SkillSearch />
          <RecommendedFreeCourses />
          <ContinueExternalCourses />

        </div>

        {/* RIGHT COLUMN */}
        <aside className="grid grid-cols-1 gap-6 content-start">
          
          <LearnerAIWidget />
          
          <LearnerAchievements user={user} />

          <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 backdrop-blur-xl relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-white/40">
                Jobs near you
              </div>
              <Link href="/jobs" className="text-[12px] text-white/60 hover:text-white underline transition-colors">
                See all
              </Link>
            </div>
            {jobsForYou.length === 0 ? (
              <div className="text-[13px] text-white/50 bg-black/20 p-4 rounded-xl border border-white/5">
                Once you earn certificates, local roles appear here.
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {jobsForYou.map((j) => (
                  <Link key={j.id} href={`/jobs/${j.id}`} className="flex items-start gap-3 group p-3 rounded-xl hover:bg-white/[0.04] transition-colors border border-transparent hover:border-white/10">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-[14px] bg-white/5 text-emerald-400 group-hover:scale-110 transition-transform shadow-inner border border-white/10"
                    >
                      {j.company.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-[14px] truncate text-white group-hover:text-emerald-400 transition-colors">{j.title}</div>
                      <div className="text-[12px] text-white/50 mt-0.5">
                        {j.company} · ${j.wageFrom}–${j.wageTo}/{j.wageUnit}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 backdrop-blur-xl relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-white/40">
                Upcoming live
              </div>
              <Link href="/live" className="text-[12px] text-white/60 hover:text-white underline transition-colors">
                All sessions
              </Link>
            </div>
            {upcomingLive.length === 0 ? (
              <div className="text-[13px] text-white/50 bg-black/20 p-4 rounded-xl border border-white/5">
                Nothing scheduled right now.
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {upcomingLive.map((l) => {
                  const teacher = findUserById(l.teacherId);
                  return (
                    <Link key={l.id} href="/live" className="block p-3 rounded-xl hover:bg-white/[0.04] transition-colors border border-transparent hover:border-white/10 group">
                      <div className="font-semibold text-[14px] text-white group-hover:text-indigo-400 transition-colors">{l.title}</div>
                      <div className="text-[12px] mt-1 text-white/50 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.8)]"></span>
                        {new Date(l.startsAt).toLocaleString(undefined, { weekday: 'short', hour: 'numeric', minute: 'numeric' })} · {teacher?.name ?? "Teacher"}
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
          
          <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 backdrop-blur-xl relative overflow-hidden">
             <div className="flex items-center justify-between mb-4">
              <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-white/40">
                Saved external courses
              </div>
              <Link href="/courses/search" className="text-[12px] text-white/60 hover:text-white underline transition-colors">
                Search
              </Link>
            </div>
            <LearnerCoursesDock />
          </div>

        </aside>
      </div>
    </div>
  );
}
