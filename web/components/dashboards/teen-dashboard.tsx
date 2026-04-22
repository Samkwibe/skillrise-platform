import Link from "next/link";
import type { User } from "@/lib/store";
import { store, userEnrollments, userCertificates, getTrack } from "@/lib/store";
import { SkillSearch } from "@/components/dashboard/skill-search";
import { UnifiedCourseSearch } from "@/components/courses/unified-course-search";
import { RecommendedFreeCourses } from "@/components/courses/learner-courses-dock";
import { StreakCalendar } from "./streak-calendar";

/**
 * Teen dashboard — "Gamified learning app".
 * XP bar, streak fire, daily quest, badge trophy case. Chunky colored tiles.
 * No Jobs, no AI Tutor, no serious analytics.
 */
function hashStreak(uid: string): number {
  return 3 + ([...uid].reduce((a, c) => a + c.charCodeAt(0), 0) % 18);
}

export function TeenDashboard({ user }: { user: User }) {
  const enrolls = userEnrollments(user.id);
  const certs = userCertificates(user.id);
  const completedModules = enrolls.reduce((s, e) => s + e.completedModuleIds.length, 0);

  // XP: 15 per module, 100 per certificate. Level threshold every 250 XP.
  const xp = completedModules * 15 + certs.length * 100;
  const level = 1 + Math.floor(xp / 250);
  const xpInLevel = xp % 250;
  const xpPct = Math.round((xpInLevel / 250) * 100);
  const streak = hashStreak(user.id);

  const youthTracks = store.tracks.filter((t) => t.youthFriendly).slice(0, 4);
  const nextTrack =
    enrolls
      .map((e) => ({ e, t: getTrack(e.trackSlug) }))
      .find(({ e, t }) => t && t.modules.length > e.completedModuleIds.length) ?? null;
  const nextModule = nextTrack?.t?.modules.find(
    (m) => !nextTrack!.e.completedModuleIds.includes(m.id),
  );

  const BADGES = [
    { id: "first-step", icon: "👟", label: "First Step", earned: completedModules >= 1, bg: "var(--teen-lime)" },
    { id: "streak-3", icon: "🔥", label: "3-Day Fire", earned: streak >= 3, bg: "var(--teen-pink)" },
    { id: "cert-1", icon: "🏅", label: "Certified", earned: certs.length >= 1, bg: "var(--teen-cyan)" },
    { id: "modules-10", icon: "⭐", label: "10 Lessons", earned: completedModules >= 10, bg: "var(--teen-purple)" },
    { id: "streak-7", icon: "🌈", label: "Week Warrior", earned: streak >= 7, bg: "var(--teen-lime)" },
    { id: "level-5", icon: "👑", label: "Level 5", earned: level >= 5, bg: "var(--teen-pink)" },
  ];

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* XP + Level hero tile */}
      <div
        className="tile-chunky tile-chunky-lime p-5 flex items-center gap-4"
        style={{ background: "linear-gradient(135deg, var(--surface-2), var(--surface-1))" }}
      >
        <div
          className="w-16 h-16 rounded-[16px] flex items-center justify-center font-black text-[28px] shrink-0"
          style={{
            background: "var(--teen-lime)",
            color: "#140a28",
            boxShadow: "4px 4px 0 0 var(--teen-pink)",
          }}
        >
          {level}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <div className="text-[10px] font-black uppercase tracking-[0.16em]" style={{ color: "var(--teen-lime)" }}>
              Level {level}
            </div>
            <div className="text-[10px] font-black uppercase tracking-[0.12em]" style={{ color: "var(--text-3)" }}>
              {xpInLevel}/250 XP
            </div>
          </div>
          <div
            className="h-3 rounded-full overflow-hidden mt-1.5"
            style={{ background: "var(--surface-3)" }}
          >
            <div
              className="h-full rounded-full"
              style={{
                width: `${xpPct}%`,
                background:
                  "linear-gradient(90deg, var(--teen-lime), var(--teen-cyan) 60%, var(--teen-pink))",
                transition: "width 0.8s ease",
              }}
            />
          </div>
          <div className="text-[12px] font-bold mt-1.5" style={{ color: "var(--text-2)" }}>
            {250 - xpInLevel} XP to Level {level + 1}
          </div>
        </div>
      </div>

      {/* Streak fire + certs count */}
      <div className="grid grid-cols-2 3xl:grid-cols-4 gap-3 sm:gap-4">
        <div className="tile-chunky tile-chunky-pink p-4 text-center">
          <div
            className="text-[46px] leading-none"
            style={{ animation: "fireFlicker 1.8s ease-in-out infinite", filter: "drop-shadow(0 4px 8px rgba(255,62,165,0.35))" }}
          >
            🔥
          </div>
          <div className="text-[32px] font-black leading-none mt-1" style={{ color: "var(--teen-pink)" }}>
            {streak}
          </div>
          <div className="text-[11px] font-black uppercase tracking-[0.15em]" style={{ color: "var(--text-2)" }}>
            day streak
          </div>
        </div>
        <div className="tile-chunky tile-chunky-cyan p-4 text-center">
          <div className="text-[46px] leading-none">🏆</div>
          <div className="text-[32px] font-black leading-none mt-1" style={{ color: "var(--teen-cyan)" }}>
            {certs.length}
          </div>
          <div className="text-[11px] font-black uppercase tracking-[0.15em]" style={{ color: "var(--text-2)" }}>
            trophies
          </div>
        </div>
      </div>

      {/* 7-day streak calendar */}
      <StreakCalendar user={user} />

      {/* Daily quest */}
      <div
        className="tile-chunky tile-chunky-purple p-5"
        style={{ background: "linear-gradient(135deg, var(--surface-1), var(--surface-2))" }}
      >
        <div className="flex items-center justify-between gap-3 mb-3">
          <div>
            <div className="text-[11px] font-black uppercase tracking-[0.16em]" style={{ color: "var(--teen-lime)" }}>
              ⚔ Today's quest
            </div>
            <div className="font-black text-[20px] leading-tight">
              {nextTrack && nextModule ? `Finish "${nextModule.title}"` : "Start your first track"}
            </div>
          </div>
          <div
            className="w-16 h-16 rounded-[18px] flex items-center justify-center text-[30px] shrink-0"
            style={{
              background: "var(--teen-purple)",
              transform: "rotate(6deg)",
              boxShadow: "4px 4px 0 0 var(--teen-lime)",
            }}
          >
            ⚡
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span
            className="inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-wider px-2 py-1 rounded-full"
            style={{ background: "var(--teen-lime)", color: "#140a28" }}
          >
            +25 XP
          </span>
          <span
            className="inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-wider px-2 py-1 rounded-full"
            style={{ background: "var(--teen-pink)", color: "#140a28" }}
          >
            +1 badge
          </span>
          {nextTrack && nextModule ? (
            <Link
              href={`/learn/${nextTrack.t!.slug}/${nextModule.id}`}
              className="ml-auto inline-flex items-center gap-1 px-4 py-2 rounded-full font-black text-[13px] uppercase tracking-wider"
              style={{ background: "var(--teen-lime)", color: "#140a28" }}
            >
              Start →
            </Link>
          ) : (
            <Link
              href="/tracks"
              className="ml-auto inline-flex items-center gap-1 px-4 py-2 rounded-full font-black text-[13px] uppercase tracking-wider"
              style={{ background: "var(--teen-lime)", color: "#140a28" }}
            >
              Pick one →
            </Link>
          )}
        </div>
      </div>

      {/* Badge trophy case */}
      <section>
        <div className="flex items-baseline justify-between mb-2">
          <h2 className="font-black text-[18px] uppercase tracking-[0.08em]">Trophy case</h2>
          <span className="text-[11px] font-bold" style={{ color: "var(--text-3)" }}>
            {BADGES.filter((b) => b.earned).length}/{BADGES.length} unlocked
          </span>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-6 3xl:grid-cols-8 4k:grid-cols-12 gap-2 sm:gap-3">
          {BADGES.map((b) => (
            <div
              key={b.id}
              className="tile-chunky p-3 text-center aspect-square flex flex-col items-center justify-center"
              style={{
                borderColor: b.earned ? b.bg : "var(--surface-4)",
                opacity: b.earned ? 1 : 0.35,
                filter: b.earned ? "none" : "grayscale(1)",
              }}
            >
              <div className="text-[28px] leading-none mb-1">{b.icon}</div>
              <div className="text-[10px] font-black uppercase tracking-wider leading-tight">
                {b.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Tracks — chunky gamified tiles */}
      <section>
        <div className="flex items-baseline justify-between mb-2">
          <h2 className="font-black text-[18px] uppercase tracking-[0.08em]">Pick a quest line</h2>
          <Link href="/tracks" className="text-[11px] font-black uppercase underline" style={{ color: "var(--teen-lime)" }}>
            See all →
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 3xl:grid-cols-4 4k:grid-cols-6 gap-3 sm:gap-4">
          {youthTracks.map((t, i) => {
            const classes = ["tile-chunky-lime", "tile-chunky-pink", "tile-chunky-cyan", "tile-chunky-purple"];
            return (
              <Link
                key={t.slug}
                href={`/tracks/${t.slug}`}
                className={`tile-chunky ${classes[i % classes.length]} p-4`}
              >
                <div className="text-[36px] leading-none mb-2">{t.heroEmoji}</div>
                <div className="font-black text-[15px] leading-tight">{t.title}</div>
                <div className="text-[11px] font-bold mt-1" style={{ color: "var(--text-3)" }}>
                  {t.weeks}w · {t.level}
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <RecommendedFreeCourses />

      <section
        className="tile-chunky tile-chunky-purple p-4"
        style={{ background: "var(--surface-1)" }}
      >
        <div className="text-[11px] font-black uppercase tracking-[0.14em] mb-2" style={{ color: "var(--teen-purple)" }}>
          🎓 Free courses & books
        </div>
        <p className="text-[12px] font-bold mb-2" style={{ color: "var(--text-2)" }}>
          Coursera, Open Library, MIT, Khan — one search.{" "}
          <Link href="/courses/search" className="underline" style={{ color: "var(--teen-lime)" }}>
            Open full page
          </Link>
        </p>
        <UnifiedCourseSearch variant="compact" />
      </section>

      {/* Skill search — framed to match teen aesthetic */}
      <section
        className="tile-chunky tile-chunky-cyan p-4"
        style={{ background: "var(--surface-1)" }}
      >
        <div className="text-[11px] font-black uppercase tracking-[0.14em] mb-2" style={{ color: "var(--teen-cyan)" }}>
          🔍 Find any video
        </div>
        <SkillSearch />
      </section>
    </div>
  );
}
