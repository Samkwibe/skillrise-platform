import type { User } from "@/lib/store";
import { userEnrollments } from "@/lib/store";
import { deriveTeenWeekLevels } from "@/lib/learner/activity-heatmap";

const WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

type Tile = "strong" | "light" | "miss" | "future";

function toTile(level: number): Tile {
  if (level < 0) return "future";
  if (level === 0) return "miss";
  if (level >= 3) return "strong";
  return "light";
}

const STYLES: Record<Tile, { bg: string; emoji: string; label: string; color: string }> = {
  strong: { bg: "linear-gradient(135deg, #ff3ea5, #ffb72b)", emoji: "🔥", label: "Big day", color: "#fff" },
  light: { bg: "var(--surface-2)", emoji: "✓", label: "Studied", color: "var(--teen-lime)" },
  miss: { bg: "transparent", emoji: "—", label: "No lessons", color: "var(--text-3)" },
  future: { bg: "transparent", emoji: "·", label: "Upcoming", color: "var(--text-3)" },
};

export function StreakCalendar({ user }: { user: User }) {
  const levels = deriveTeenWeekLevels(userEnrollments(user.id));
  const days = levels.map(toTile);
  const strong = days.filter((d) => d === "strong").length;
  const light = days.filter((d) => d === "light").length;
  const activeStreak = (() => {
    let s = 0;
    for (let i = days.length - 1; i >= 0; i--) {
      if (days[i] === "strong" || days[i] === "light") s++;
      else if (days[i] === "future") continue;
      else break;
    }
    return s;
  })();

  const todayIdx = (new Date().getDay() + 6) % 7;

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
            {activeStreak} active day{activeStreak !== 1 ? "s" : ""}
            {strong > 0 && <span style={{ color: "var(--teen-lime)" }}> · {strong} strong</span>}
          </div>
        </div>
        {light > 0 && (
          <div
            className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1"
            style={{ background: "var(--teen-cyan)", color: "#140a28" }}
          >
            ✓ {light} studied
          </div>
        )}
      </div>

      <p className="text-[11px] font-bold mb-3" style={{ color: "var(--text-3)" }}>
        From lessons you finished this calendar week — not random filler.
      </p>

      <div className="grid grid-cols-7 gap-1.5">
        {days.map((kind, i) => {
          const s = STYLES[kind];
          const isToday = i === todayIdx;
          return (
            <div key={WEEK[i]} className="flex flex-col items-center gap-1">
              <div
                className="w-full aspect-square rounded-[14px] flex items-center justify-center text-[22px] font-black"
                style={{
                  background: s.bg,
                  color: s.color,
                  border: kind === "miss" || kind === "future" ? "2px dashed var(--border-2)" : "2px solid transparent",
                  boxShadow: kind === "strong" ? "0 6px 16px rgba(255,62,165,0.4)" : "none",
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
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: "linear-gradient(135deg, #ff3ea5, #ffb72b)" }} />
          Strong
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: "var(--surface-3)" }} />
          Studied
        </span>
      </div>
    </div>
  );
}
