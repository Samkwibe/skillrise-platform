import Link from "next/link";
import type { User } from "@/lib/store";
import { userEnrollments, getTrack } from "@/lib/store";
import { estimatedMinutesFromCompletedLessons } from "@/lib/learner/study-time-estimate";

/**
 * Weekly goal — uses onboarding time target and real completed-lesson minute estimates.
 */
export function WeeklyGoal({ user }: { user: User }) {
  const enrolls = userEnrollments(user.id);
  const targetPerDay = user.onboarding?.timePerDay ?? 30;
  const targetWeek = targetPerDay * 7;
  const estimatedMins = estimatedMinutesFromCompletedLessons(enrolls, getTrack);
  const weekPct =
    targetWeek > 0 ? Math.min(100, Math.round((Math.min(estimatedMins, targetWeek) / targetWeek) * 100)) : 0;

  const next = enrolls
    .map((e) => ({ e, t: getTrack(e.trackSlug) }))
    .find(({ e, t }) => t && t.modules.length > e.completedModuleIds.length);
  const suggestion = next?.t?.modules.find((m) => !next!.e.completedModuleIds.includes(m.id));

  return (
    <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 backdrop-blur-xl relative overflow-hidden group hover:bg-white/[0.04] transition-colors">
      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none group-hover:bg-emerald-500/20 transition-colors" />
      <div className="flex items-start justify-between gap-4 mb-4 relative z-10">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-emerald-400 mb-1">Study goal</div>
          <div
            className="text-[20px] font-extrabold leading-tight text-white drop-shadow-sm"
            style={{ fontFamily: "var(--role-font-display)", letterSpacing: "-0.01em" }}
          >
            ~{estimatedMins}
            <span className="text-[14px] font-medium text-white/50"> min from finished lessons</span>
          </div>
          <div className="text-[12px] text-white/60 mt-0.5">
            Weekly target from your onboarding: {targetPerDay} min/day ({targetWeek} min/week). Totals are estimates from
            lesson lengths.
          </div>
        </div>
        <Link
          href="/onboarding"
          className="text-[12px] text-emerald-400 hover:text-emerald-300 font-semibold whitespace-nowrap shrink-0"
        >
          Adjust goal →
        </Link>
      </div>

      <div className="relative z-10 mb-4">
        <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-700"
            style={{ width: `${weekPct}%` }}
          />
        </div>
        <div className="text-[11px] mt-2 text-white/50">
          {weekPct}% of this week&apos;s minute target · Per-day charts will use real timestamps when activity logging
          ships.
        </div>
      </div>

      <div className="mt-2 flex items-center justify-end gap-4 relative z-10">
        {suggestion && next?.t && (
          <Link
            href={`/learn/${next.t.slug}/${suggestion.id}`}
            className="px-4 py-2 rounded-xl bg-white text-black font-bold text-sm hover:bg-white/90 hover:scale-105 transition-all shadow-[0_0_20px_rgba(255,255,255,0.15)] shrink-0"
          >
            Next lesson →
          </Link>
        )}
      </div>
    </div>
  );
}
