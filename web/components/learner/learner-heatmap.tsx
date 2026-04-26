import type { HeatmapCell } from "@/lib/learner/activity-heatmap";

const LEVEL_CLASSES = [
  "bg-white/5 border border-white/5",
  "bg-emerald-900/40 border border-emerald-500/20",
  "bg-emerald-700/60 border border-emerald-500/30",
  "bg-emerald-500/80 border border-emerald-400/50 shadow-[0_0_8px_rgba(16,185,129,0.3)]",
  "bg-emerald-400 border border-emerald-300 shadow-[0_0_12px_rgba(52,211,153,0.6)]",
];

export function LearnerHeatmap({
  cells,
  streakDays,
  hasActivity,
}: {
  cells: HeatmapCell[];
  streakDays: number;
  hasActivity: boolean;
}) {
  return (
    <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 backdrop-blur-xl relative overflow-hidden group hover:bg-white/[0.04] transition-colors">
      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none group-hover:bg-emerald-500/10 transition-colors" />

      <div className="flex items-center justify-between mb-4 relative z-10">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <span className="text-emerald-400">🔥</span> Learning activity
          </h3>
          <p className="text-[11px] text-white/50 mt-0.5">
            Built from your enrollments and completed lessons (not simulated data).
          </p>
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
          {hasActivity ? `${streakDays}d streak` : "No streak yet"}
        </span>
      </div>

      {!hasActivity ? (
        <p className="text-[13px] text-white/55 relative z-10 py-6 text-center border border-dashed border-white/10 rounded-xl">
          Complete a lesson to light up your graph. Days reflect when you finish modules in your tracks.
        </p>
      ) : (
        <div className="flex-1 overflow-x-auto scroll-slim pb-2 relative z-10">
          <div className="min-w-[400px]">
            <div className="grid grid-rows-7 grid-flow-col gap-1">
              {cells.map((day, i) => (
                <div
                  key={i}
                  className={`w-3 h-3 rounded-[3px] transition-all hover:ring-2 hover:ring-white/50 cursor-default hover:scale-125 ${LEVEL_CLASSES[day.level]}`}
                  title={day.title}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {hasActivity ? (
        <div className="mt-4 flex items-center gap-2 text-[10px] font-medium text-white/40 justify-end relative z-10">
          <span>Less</span>
          <div className="flex gap-1">
            {LEVEL_CLASSES.map((cls, i) => (
              <div key={i} className={`w-2.5 h-2.5 rounded-[2px] ${cls}`} />
            ))}
          </div>
          <span>More</span>
        </div>
      ) : null}
    </div>
  );
}
