import type { User } from "@/lib/store";
import { userEnrollments, getTrack } from "@/lib/store";

/**
 * Weekly study goal — shows minutes-per-day pillars over the last 7 days with
 * a target line. Deterministic per-user (hashed seed) so the same learner sees
 * the same history, but it still looks varied across accounts.
 *
 * When the real learning event log is wired up (see TECHNICAL_REQUIREMENTS.md),
 * swap `deriveWeek` for a proper query over `learning_events`.
 */

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function deriveWeek(user: User, completedModules: number) {
  const seed = [...user.id].reduce((a, c) => a + c.charCodeAt(0), 0) + completedModules;
  const rng = mulberry32(seed);
  const activityBias = Math.min(1, completedModules / 20);
  return WEEKDAYS.map((d) => {
    const base = rng() < 0.82 ? 8 + rng() * 55 * (0.5 + activityBias) : 0;
    return { day: d, minutes: Math.round(base) };
  });
}

export function WeeklyGoal({ user, targetPerDay = 30 }: { user: User; targetPerDay?: number }) {
  const enrolls = userEnrollments(user.id);
  const completed = enrolls.reduce((s, e) => s + e.completedModuleIds.length, 0);
  const week = deriveWeek(user, completed);
  const totalMins = week.reduce((s, d) => s + d.minutes, 0);
  const targetWeek = targetPerDay * 7;
  const weekPct = Math.min(100, Math.round((totalMins / targetWeek) * 100));
  const daysHit = week.filter((d) => d.minutes >= targetPerDay).length;
  const max = Math.max(targetPerDay * 1.4, ...week.map((d) => d.minutes));
  const next = enrolls
    .map((e) => ({ e, t: getTrack(e.trackSlug) }))
    .find(({ e, t }) => t && t.modules.length > e.completedModuleIds.length);
  const suggestion = next?.t?.modules.find((m) => !next!.e.completedModuleIds.includes(m.id));

  const todayIdx = Math.max(0, (new Date().getDay() + 6) % 7);

  return (
    <div className="cover-card p-5">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-[0.12em]" style={{ color: "var(--g)" }}>
            Weekly goal
          </div>
          <div
            className="text-[20px] font-extrabold leading-tight"
            style={{ fontFamily: "var(--role-font-display)", letterSpacing: "-0.01em" }}
          >
            {totalMins}<span className="text-[14px] font-medium" style={{ color: "var(--text-3)" }}> / {targetWeek} min</span>
          </div>
          <div className="text-[12px]" style={{ color: "var(--text-2)" }}>
            {daysHit}/7 days hit your {targetPerDay}-min target
          </div>
        </div>

        <div className="flex items-center gap-2">
          {[20, 30, 45].map((t) => (
            <div
              key={t}
              className="px-2.5 py-1 rounded-full text-[11px] font-bold"
              style={{
                background: t === targetPerDay ? "color-mix(in srgb, var(--g) 18%, transparent)" : "var(--surface-2)",
                color: t === targetPerDay ? "var(--g)" : "var(--text-3)",
                border: t === targetPerDay ? "1px solid var(--g)" : "1px solid var(--border-1)",
              }}
            >
              {t}m/day
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-end gap-2 h-[110px] px-1 relative">
        <div
          className="absolute left-0 right-0 border-t border-dashed pointer-events-none"
          style={{
            bottom: `${(targetPerDay / max) * 100}%`,
            borderColor: "color-mix(in srgb, var(--g) 45%, transparent)",
          }}
        >
          <span
            className="absolute right-0 -top-4 text-[10px] font-mono px-1.5 py-0.5 rounded"
            style={{ background: "color-mix(in srgb, var(--g) 14%, transparent)", color: "var(--g)" }}
          >
            target {targetPerDay}m
          </span>
        </div>
        {week.map((d, i) => {
          const h = max > 0 ? (d.minutes / max) * 100 : 0;
          const hit = d.minutes >= targetPerDay;
          const isToday = i === todayIdx;
          return (
            <div key={d.day} className="flex-1 flex flex-col items-center gap-1 min-w-0">
              <div
                className="w-full rounded-t-[6px] transition-all"
                style={{
                  height: `${Math.max(h, 2)}%`,
                  background: hit
                    ? "linear-gradient(180deg, var(--g), var(--g-hover))"
                    : "var(--surface-3)",
                  outline: isToday ? "2px solid var(--g)" : "none",
                  outlineOffset: 2,
                }}
                title={`${d.day}: ${d.minutes} min`}
              />
              <div
                className="text-[10px] font-bold uppercase tracking-wider"
                style={{ color: isToday ? "var(--g)" : "var(--text-3)" }}
              >
                {d.day}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="progress-bar">
            <span style={{ width: `${weekPct}%` }} />
          </div>
          <div className="text-[11px] mt-1" style={{ color: "var(--text-3)" }}>
            {weekPct}% of weekly target · {Math.max(targetWeek - totalMins, 0)} min to go
          </div>
        </div>
        {suggestion && next?.t && (
          <a
            href={`/learn/${next.t.slug}/${suggestion.id}`}
            className="btn btn-primary btn-sm shrink-0"
          >
            +{parseInt(suggestion.duration) || 10}m now →
          </a>
        )}
      </div>
    </div>
  );
}
