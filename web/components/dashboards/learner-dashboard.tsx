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

/**
 * Learner dashboard — "Modern course platform".
 * Layout: 2-column magazine. Left hero = "Next module" cover card + track
 * cover cards with circular progress rings. Right rail = jobs + AI tutor + live.
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

  // Personalized picks from onboarding answers. Falls back to general
  // "recommended" when a user hasn't completed onboarding yet.
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
    <div>
      {/* Hero row: Next module cover card + stats ring */}
      <div className="grid lg:grid-cols-[2fr_1fr] gap-4 md:gap-5 mb-6 md:mb-8">
        {primary && primaryTrack && primaryNext ? (
          <Link
            href={`/learn/${primaryTrack.slug}/${primaryNext.id}`}
            className="cover-card p-0 group"
          >
            <div
              className="h-[180px] md:h-[220px] relative flex items-end p-6"
              style={{
                background: `linear-gradient(135deg, rgba(${primaryTrack.color},0.9), rgba(${primaryTrack.color},0.55) 60%, var(--surface-3))`,
              }}
            >
              <div className="absolute top-5 left-6 text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color: "rgba(255,255,255,0.85)" }}>
                Continue where you left off
              </div>
              <div className="absolute top-5 right-6 text-[54px] opacity-80">{primaryTrack.heroEmoji}</div>
              <div className="relative z-10">
                <div
                  className="text-[24px] md:text-[32px] font-extrabold leading-[1.05] text-white"
                  style={{ fontFamily: "var(--role-font-display)", letterSpacing: "-0.01em", textShadow: "0 1px 2px rgba(0,0,0,0.3)" }}
                >
                  {primaryTrack.title}
                </div>
                <div className="text-white/90 text-[14px] font-medium mt-1">
                  Next: {primaryNext.title} · {primaryNext.duration}
                </div>
              </div>
            </div>
            <div className="p-5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="progress-bar w-[160px] md:w-[260px]">
                  <span style={{ width: `${primaryPct}%` }} />
                </div>
                <div className="font-mono text-[13px]" style={{ color: "var(--text-2)" }}>
                  {primary.completedModuleIds.length}/{primaryTrack.modules.length} modules
                </div>
              </div>
              <span
                className="inline-flex items-center gap-1 px-4 py-2 rounded-full font-bold text-[13px] group-hover:translate-x-1 transition-transform"
                style={{ background: "var(--g)", color: "var(--bg)" }}
              >
                Resume →
              </span>
            </div>
          </Link>
        ) : (
          <div className="cover-card p-8 text-center">
            <div className="text-[32px] mb-2">🧭</div>
            <div className="text-[18px] font-bold mb-1">Pick your first track</div>
            <div className="text-[13px] mb-4" style={{ color: "var(--text-2)" }}>
              Most learners finish their first module within a day.
            </div>
            <Link href="/tracks" className="btn btn-primary">
              Browse tracks
            </Link>
          </div>
        )}

        <div className="cover-card p-6 flex flex-col items-center justify-center gap-2 text-center">
          <ProgressRing
            value={completionPct}
            size={140}
            stroke={12}
            color="var(--g)"
            sublabel="overall"
          />
          <div className="flex items-center gap-4 mt-4 text-[12px]" style={{ color: "var(--text-2)" }}>
            <div className="flex flex-col items-center">
              <div className="font-extrabold text-[18px]" style={{ color: "var(--text-1)", fontFamily: "var(--role-font-display)" }}>
                {enrolls.length}
              </div>
              <div className="uppercase tracking-wider text-[10.5px]">Tracks</div>
            </div>
            <div className="w-px h-8" style={{ background: "var(--border-1)" }} />
            <div className="flex flex-col items-center">
              <div className="font-extrabold text-[18px]" style={{ color: "var(--g)", fontFamily: "var(--role-font-display)" }}>
                {certs.length}
              </div>
              <div className="uppercase tracking-wider text-[10.5px]">Certificates</div>
            </div>
            <div className="w-px h-8" style={{ background: "var(--border-1)" }} />
            <div className="flex flex-col items-center">
              <div className="font-extrabold text-[18px]" style={{ color: "var(--text-1)", fontFamily: "var(--role-font-display)" }}>
                {completedModules}
              </div>
              <div className="uppercase tracking-wider text-[10.5px]">Lessons</div>
            </div>
          </div>
        </div>
      </div>

      {/* "Because you said…" — personalization block driven by onboarding.
          Only renders when the user has completed onboarding AND the engine
          produced at least one match. Learners who skipped onboarding see
          a gentle invitation to take it instead. */}
      {personalized.length > 0 ? (
        <section
          className="cover-card p-5 md:p-6 mb-6"
          style={{
            background:
              "linear-gradient(180deg, color-mix(in srgb, var(--g) 8%, transparent), transparent)",
          }}
        >
          <div className="flex flex-wrap items-end justify-between gap-2 mb-4">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-[0.12em] mb-1" style={{ color: "var(--g)" }}>
                ◆ Picked for you
              </div>
              <h2
                className="text-[20px] md:text-[22px] font-extrabold"
                style={{ fontFamily: "var(--role-font-display)", letterSpacing: "-0.01em" }}
              >
                {struggleLabels.length > 0
                  ? `Because you said ${struggleLabels.slice(0, 2).join(" & ").toLowerCase()}…`
                  : "Based on what you told us"}
              </h2>
              <p className="text-[13.5px] mt-1" style={{ color: "var(--text-2)" }}>
                Start small. One video a day beats one marathon and a month of nothing.
              </p>
            </div>
            <Link href="/onboarding" className="text-[12.5px] underline" style={{ color: "var(--text-2)" }}>
              Update my answers
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 3xl:grid-cols-4 4k:grid-cols-6 gap-3">
            {personalized.slice(0, 6).map((t) => {
              const cat = LIFE_CATEGORIES.find((c) => c.id === t.category);
              return (
                <Link
                  key={t.slug}
                  href={`/tracks/${t.slug}`}
                  className="cover-card overflow-hidden flex flex-col"
                >
                  <div
                    className="p-4 flex items-start justify-between"
                    style={{
                      background: `linear-gradient(135deg, rgba(${t.color},0.45), rgba(${t.color},0.15))`,
                    }}
                  >
                    <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/90">
                      {cat?.label ?? "Life skill"}
                    </div>
                    <div className="text-[26px]">{t.heroEmoji}</div>
                  </div>
                  <div className="p-4 flex-1 flex flex-col">
                    <div
                      className="font-bold text-[14.5px] leading-tight mb-1"
                      style={{ fontFamily: "var(--role-font-display)" }}
                    >
                      {t.title}
                    </div>
                    <div className="text-[12.5px] flex-1" style={{ color: "var(--text-3)" }}>
                      {t.summary}
                    </div>
                    <div
                      className="text-[11px] mt-3 pt-3"
                      style={{ color: "var(--text-2)", borderTop: "1px solid var(--border-1)" }}
                    >
                      {t.weeks} wk · {t.modules.length} lessons ·{" "}
                      {(user.onboarding?.timePerDay ?? 15)}-min sessions
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      ) : !user.onboarding ? (
        <Link
          href="/onboarding"
          className="cover-card p-5 md:p-6 mb-6 flex items-start md:items-center gap-4 group"
          style={{ background: "color-mix(in srgb, var(--g) 10%, var(--surface-1))" }}
        >
          <div className="text-[32px] shrink-0">👋</div>
          <div className="flex-1 min-w-0">
            <div className="text-[11px] font-bold uppercase tracking-[0.12em]" style={{ color: "var(--g)" }}>
              Take 60 seconds
            </div>
            <div className="text-[17px] md:text-[19px] font-extrabold" style={{ fontFamily: "var(--role-font-display)" }}>
              Tell us what you're struggling with.
            </div>
            <div className="text-[13.5px]" style={{ color: "var(--text-2)" }}>
              We'll tailor your tracks, your feed, and your job matches. You can skip anything.
            </div>
          </div>
          <span
            className="hidden md:inline-flex items-center gap-1 px-4 py-2 rounded-full font-bold text-[13px] group-hover:translate-x-1 transition-transform"
            style={{ background: "var(--g)", color: "var(--bg)" }}
          >
            Start →
          </span>
        </Link>
      ) : null}

      {/* Weekly goal tracker */}
      <div className="mb-6">
        <WeeklyGoal user={user} />
      </div>

      <RecommendedFreeCourses />
      <ContinueExternalCourses />

      {/* Unified free-course search (Coursera, Open Library, MIT, Khan) */}
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-[0.1em] text-t3 mb-1">Free courses & books</div>
          <h2
            className="text-[20px] md:text-[22px] font-extrabold"
            style={{ fontFamily: "var(--role-font-display)", letterSpacing: "-0.01em" }}
          >
            Search the open web like a course app
          </h2>
        </div>
        <Link
          href="/courses/search"
          className="btn btn-ghost btn-sm"
        >
          Browse all free courses
        </Link>
      </div>
      <UnifiedCourseSearch variant="compact" />

      {/* Skill search — free videos (YouTube / tiered) */}
      <SkillSearch />

      {/* 2-col magazine: track rings + right rail. On ultrawide, the right rail
          becomes a side-by-side 2-col rail so 4K users don't stare at empty space. */}
      <div className="grid lg:grid-cols-[1fr_340px] 3xl:grid-cols-[1fr_720px] 4k:grid-cols-[1fr_860px] gap-5 md:gap-6 mt-4">
        <section>
          <div className="flex items-end justify-between mb-4">
            <h2
              className="text-[22px] font-extrabold"
              style={{ fontFamily: "var(--role-font-display)", letterSpacing: "-0.01em" }}
            >
              Your tracks
            </h2>
            <Link href="/tracks" className="text-[13px] underline" style={{ color: "var(--text-2)" }}>
              Browse all →
            </Link>
          </div>

          {enrolls.length === 0 ? (
            <div className="cover-card p-6 text-center text-[14px]" style={{ color: "var(--text-2)" }}>
              No active tracks yet. Browse the catalog to start.
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 xl:grid-cols-2 3xl:grid-cols-3 4k:grid-cols-4 gap-3 md:gap-4">
              {enrolls.map((e) => {
                const t = getTrack(e.trackSlug);
                if (!t) return null;
                const pct = Math.round((e.completedModuleIds.length / t.modules.length) * 100);
                const next = t.modules.find((m) => !e.completedModuleIds.includes(m.id));
                return (
                  <Link key={e.id} href={`/tracks/${t.slug}`} className="cover-card overflow-hidden flex flex-col">
                    <div
                      className="h-[72px] p-4 flex items-start justify-between"
                      style={{ background: `linear-gradient(135deg, rgba(${t.color},0.45), rgba(${t.color},0.15))` }}
                    >
                      <div className="text-[11px] font-bold uppercase tracking-wider text-white/90">
                        {t.level} · {t.weeks} wks
                      </div>
                      <div className="text-[30px] -mt-1">{t.heroEmoji}</div>
                    </div>
                    <div className="p-4 flex gap-3 items-center">
                      <ProgressRing value={pct} size={62} stroke={7} color="var(--g)" />
                      <div className="min-w-0 flex-1">
                        <div
                          className="font-bold text-[15px] leading-tight truncate"
                          style={{ fontFamily: "var(--role-font-display)" }}
                        >
                          {t.title}
                        </div>
                        <div className="text-[12px] truncate" style={{ color: "var(--text-2)" }}>
                          {next ? `Next: ${next.title}` : "Completed"}
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {/* Certificate thermometer */}
          <section className="cover-card p-5 mt-6">
            <div className="flex items-center justify-between mb-2">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-[0.12em]" style={{ color: "var(--text-3)" }}>
                  Certificates
                </div>
                <div className="font-extrabold text-[18px]" style={{ fontFamily: "var(--role-font-display)" }}>
                  {certs.length} earned · {Math.max(0, enrolls.length - certs.length)} in progress
                </div>
              </div>
              <Link href="/cert" className="text-[13px] underline" style={{ color: "var(--text-2)" }}>
                View all →
              </Link>
            </div>
            <div className="flex gap-1.5 mt-3">
              {Array.from({ length: Math.max(enrolls.length, 4) }).map((_, i) => (
                <div
                  key={i}
                  className="flex-1 h-2 rounded-full"
                  style={{
                    background: i < certs.length ? "var(--g)" : "var(--border-1)",
                    transition: "background 0.3s ease",
                  }}
                />
              ))}
            </div>
          </section>

          {recommended.length > 0 && (
            <section className="mt-6">
              <h3
                className="text-[16px] font-extrabold mb-3"
                style={{ fontFamily: "var(--role-font-display)" }}
              >
                Recommended next
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 3xl:grid-cols-4 4k:grid-cols-5 gap-3">
                {recommended.map((t) => (
                  <Link key={t.slug} href={`/tracks/${t.slug}`} className="cover-card p-4">
                    <div className="text-[28px] mb-2">{t.heroEmoji}</div>
                    <div
                      className="font-bold text-[14px] leading-tight"
                      style={{ fontFamily: "var(--role-font-display)" }}
                    >
                      {t.title}
                    </div>
                    <div className="text-[12px] mt-1" style={{ color: "var(--text-3)" }}>
                      {t.weeks} wks · {t.level}
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </section>

        {/* Right rail — on ultrawide, reflow to a 2-column rail. */}
        <aside className="grid grid-cols-1 3xl:grid-cols-2 gap-4 content-start">
          <div className="cover-card p-5">
            <div className="flex items-center justify-between mb-2">
              <div className="text-[11px] font-bold uppercase tracking-[0.12em]" style={{ color: "var(--text-3)" }}>
                Saved external courses
              </div>
              <Link href="/courses/search" className="text-[11px] underline" style={{ color: "var(--text-2)" }}>
                Search
              </Link>
            </div>
            <LearnerCoursesDock />
          </div>

          <div className="cover-card p-5" style={{ background: "linear-gradient(180deg, rgba(245,158,11,0.08), transparent)" }}>
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.12em]" style={{ color: "var(--g)" }}>
              ◆ AI Tutor
            </div>
            <div
              className="text-[17px] font-extrabold mt-1 mb-2"
              style={{ fontFamily: "var(--role-font-display)" }}
            >
              Stuck on something? Ask.
            </div>
            <div className="text-[13px] mb-4" style={{ color: "var(--text-2)" }}>
              A tutor trained on your current track, live and streaming.
            </div>
            <Link href="/assistant" className="btn btn-primary btn-sm">
              Open tutor →
            </Link>
          </div>

          <div className="cover-card p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="text-[11px] font-bold uppercase tracking-[0.12em]" style={{ color: "var(--text-3)" }}>
                Jobs near you
              </div>
              <Link href="/jobs" className="text-[11px] underline" style={{ color: "var(--text-2)" }}>
                See all
              </Link>
            </div>
            {jobsForYou.length === 0 ? (
              <div className="text-[13px]" style={{ color: "var(--text-2)" }}>
                Once you earn certificates, local roles appear here.
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {jobsForYou.map((j) => (
                  <Link key={j.id} href={`/jobs/${j.id}`} className="flex items-start gap-3 group">
                    <div
                      className="w-9 h-9 rounded-[10px] flex items-center justify-center font-bold text-[13px]"
                      style={{ background: "var(--surface-3)", color: "var(--g)" }}
                    >
                      {j.company.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-[13.5px] truncate group-hover:underline">{j.title}</div>
                      <div className="text-[11.5px]" style={{ color: "var(--text-3)" }}>
                        {j.company} · ${j.wageFrom}–${j.wageTo}/{j.wageUnit}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="cover-card p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="text-[11px] font-bold uppercase tracking-[0.12em]" style={{ color: "var(--text-3)" }}>
                Upcoming live
              </div>
              <Link href="/live" className="text-[11px] underline" style={{ color: "var(--text-2)" }}>
                All sessions
              </Link>
            </div>
            {upcomingLive.length === 0 ? (
              <div className="text-[13px]" style={{ color: "var(--text-2)" }}>
                Nothing scheduled right now.
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {upcomingLive.map((l) => {
                  const teacher = findUserById(l.teacherId);
                  return (
                    <Link key={l.id} href="/live" className="block">
                      <div className="font-semibold text-[13.5px]">{l.title}</div>
                      <div className="text-[11.5px] mt-0.5" style={{ color: "var(--text-3)" }}>
                        {new Date(l.startsAt).toLocaleString()} · {teacher?.name ?? "Teacher"}
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
