import type { Enrollment, Track } from "@/lib/store";

/** Parse "12 min", "5m", "8 minutes" → minutes (fallback 10). */
export function parseModuleMinutes(duration: string | undefined): number {
  if (!duration) return 10;
  const m = duration.match(/(\d+)/);
  return m ? Math.min(180, Math.max(1, parseInt(m[1], 10))) : 10;
}

export function estimatedMinutesFromCompletedLessons(
  enrolls: Enrollment[],
  getTrack: (slug: string) => Track | null | undefined,
): number {
  let sum = 0;
  for (const e of enrolls) {
    const t = getTrack(e.trackSlug);
    if (!t) continue;
    for (const mid of e.completedModuleIds) {
      const mod = t.modules.find((x) => x.id === mid);
      sum += parseModuleMinutes(mod?.duration);
    }
  }
  return sum;
}
