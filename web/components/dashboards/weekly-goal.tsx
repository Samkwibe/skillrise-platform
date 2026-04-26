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
    <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 backdrop-blur-xl relative overflow-hidden group hover:bg-white/[0.04] transition-colors">
      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none group-hover:bg-emerald-500/20 transition-colors"></div>
      <div className="flex items-start justify-between gap-4 mb-4 relative z-10">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-emerald-400 mb-1">
            Weekly goal
          </div>
          <div
            className="text-[20px] font-extrabold leading-tight text-white drop-shadow-sm"
            style={{ fontFamily: "var(--role-font-display)", letterSpacing: "-0.01em" }}
          >
            {totalMins}<span className="text-[14px] font-medium text-white/50"> / {targetWeek} min</span>
          </div>
          <div className="text-[12px] text-white/60 mt-0.5">
            {daysHit}/7 days hit your {targetPerDay}-min target
          </div>
        </div>

        <div className="flex items-center gap-2">
          {[20, 30, 45].map((t) => (
            <div
              key={t}
              className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-colors ${
                t === targetPerDay 
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.2)]" 
                  : "bg-white/5 text-white/50 border border-white/10 hover:bg-white/10 hover:text-white/80"
              }`}
            >
              {t}m/day
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-end gap-2 h-[110px] px-1 relative z-10">
        <div
          className="absolute left-0 right-0 border-t border-dashed pointer-events-none"
          style={{
            bottom: `${(targetPerDay / max) * 100}%`,
            borderColor: "rgba(16, 185, 129, 0.4)",
          }}
        >
          <span
            className="absolute right-0 -top-4 text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-medium"
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
                className="w-full rounded-t-[6px] transition-all duration-500 ease-out"
                style={{
                  height: `${Math.max(h, 2)}%`,
                  background: hit
                    ? "linear-gradient(180deg, #10b981, #047857)"
                    : "rgba(255, 255, 255, 0.05)",
                  outline: isToday ? "2px solid #10b981" : "none",
                  outlineOffset: 2,
                  boxShadow: hit && isToday ? "0 0 12px rgba(16, 185, 129, 0.4)" : "none"
                }}
                title={`${d.day}: ${d.minutes} min`}
              />
              <div
                className={`text-[10px] font-bold uppercase tracking-wider ${isToday ? "text-emerald-400" : "text-white/40"}`}
              >
                {d.day}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-5 flex items-center justify-between gap-4 relative z-10">
        <div className="flex-1 min-w-0">
          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-1000" 
              style={{ width: `${weekPct}%` }} 
            />
          </div>
          <div className="text-[11px] mt-2 text-white/50">
            {weekPct}% of weekly target · {Math.max(targetWeek - totalMins, 0)} min to go
          </div>
        </div>
        {suggestion && next?.t && (
          <a
            href={`/learn/${next.t.slug}/${suggestion.id}`}
            className="px-4 py-2 rounded-xl bg-white text-black font-bold text-sm hover:bg-white/90 hover:scale-105 transition-all shadow-[0_0_20px_rgba(255,255,255,0.15)] shrink-0"
          >
            +{parseInt(suggestion.duration) || 10}m now →
          </a>
        )}
      </div>
    </div>
  );
}
