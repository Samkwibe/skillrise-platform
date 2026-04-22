import type { User } from "@/lib/store";

/**
 * Teen streak calendar — visualizes the last 7 days of activity with big
 * chunky tiles. "On fire" days glow, "freezes" save a broken streak.
 */

const WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function deriveDays(user: User): Array<"fire" | "ok" | "freeze" | "miss" | "future"> {
  const seed = [...user.id].reduce((a, c) => a + c.charCodeAt(0), 0);
  const rng = (n: number) => {
    const x = Math.sin(seed * 9301 + n * 49297) * 233280;
    return x - Math.floor(x);
  };
  const today = (new Date().getDay() + 6) % 7;
  return WEEK.map((_, i) => {
    if (i > today) return "future";
    const r = rng(i);
    if (r > 0.85) return "freeze";
    if (r > 0.25) return r > 0.6 ? "fire" : "ok";
    return "miss";
  });
}

const STYLES: Record<"fire" | "ok" | "freeze" | "miss" | "future", { bg: string; emoji: string; label: string; color: string }> = {
  fire: { bg: "linear-gradient(135deg, #ff3ea5, #ffb72b)", emoji: "🔥", label: "On fire", color: "#fff" },
  ok: { bg: "var(--surface-2)", emoji: "✓", label: "Studied", color: "var(--teen-lime)" },
  freeze: { bg: "linear-gradient(135deg, #22d3ee, #c0ff00)", emoji: "❄", label: "Freeze used", color: "#140a28" },
  miss: { bg: "transparent", emoji: "—", label: "Missed", color: "var(--text-3)" },
  future: { bg: "transparent", emoji: "·", label: "Upcoming", color: "var(--text-3)" },
};

export function StreakCalendar({ user }: { user: User }) {
  const days = deriveDays(user);
  const fires = days.filter((d) => d === "fire").length;
  const freezes = days.filter((d) => d === "freeze").length;
  const activeStreak = (() => {
    let s = 0;
    for (let i = days.length - 1; i >= 0; i--) {
      if (days[i] === "fire" || days[i] === "ok" || days[i] === "freeze") s++;
      else if (days[i] === "future") continue;
      else break;
    }
    return s;
  })();

  return (
    <div
      className="tile-chunky tile-chunky-pink p-4"
      style={{ background: "linear-gradient(135deg, var(--surface-1), var(--surface-2))" }}
    >
      <div className="flex items-baseline justify-between mb-3">
        <div>
          <div className="text-[10px] font-black uppercase tracking-[0.16em]" style={{ color: "var(--teen-pink)" }}>
            This week
          </div>
          <div className="text-[18px] font-black leading-tight">
            {activeStreak} day streak{fires > 0 && <span style={{ color: "var(--teen-lime)" }}> · {fires}🔥</span>}
          </div>
        </div>
        {freezes > 0 && (
          <div
            className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1"
            style={{ background: "var(--teen-cyan)", color: "#140a28" }}
          >
            ❄ × {freezes} saved
          </div>
        )}
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {days.map((kind, i) => {
          const s = STYLES[kind];
          const isToday = i === (new Date().getDay() + 6) % 7;
          return (
            <div key={WEEK[i]} className="flex flex-col items-center gap-1">
              <div
                className="w-full aspect-square rounded-[14px] flex items-center justify-center text-[22px] font-black"
                style={{
                  background: s.bg,
                  color: s.color,
                  border: kind === "miss" || kind === "future" ? "2px dashed var(--border-2)" : "2px solid transparent",
                  boxShadow: kind === "fire" ? "0 6px 16px rgba(255,62,165,0.4)" : "none",
                  outline: isToday ? "3px solid var(--teen-lime)" : "none",
                  outlineOffset: 2,
                }}
                title={`${WEEK[i]}: ${s.label}`}
              >
                {s.emoji}
              </div>
              <div
                className="text-[10px] font-black uppercase tracking-wider"
                style={{ color: isToday ? "var(--teen-lime)" : "var(--text-3)" }}
              >
                {WEEK[i]}
              </div>
            </div>
          );
        })}
      </div>

      <div
        className="mt-3 flex items-center gap-3 text-[10px] font-bold uppercase tracking-wider"
        style={{ color: "var(--text-3)" }}
      >
        <span className="flex items-center gap-1.5">
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ background: "linear-gradient(135deg, #ff3ea5, #ffb72b)" }}
          />
          Fire
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ background: "linear-gradient(135deg, #22d3ee, #c0ff00)" }}
          />
          Freeze
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: "var(--surface-3)" }} />
          Studied
        </span>
      </div>
    </div>
  );
}
