import type { Enrollment } from "@/lib/store";

function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Spread module completions across the enrollment window (real progress, not random). */
function enrollmentActivityByDay(e: Enrollment, now: number): Map<string, number> {
  const out = new Map<string, number>();
  const n = e.completedModuleIds.length;
  const start = Math.min(e.startedAt, now);
  const end = Math.min(e.completedAt ?? now, now);
  if (n === 0) {
    const d = new Date(start);
    d.setHours(0, 0, 0, 0);
    const k = dayKey(d);
    out.set(k, (out.get(k) ?? 0) + 1);
    return out;
  }
  const span = Math.max(86_400_000, end - start);
  for (let i = 0; i < n; i++) {
    const t = start + Math.floor((span * (i + 1)) / (n + 1));
    const d = new Date(t);
    d.setHours(0, 0, 0, 0);
    const k = dayKey(d);
    out.set(k, (out.get(k) ?? 0) + 2);
  }
  return out;
}

function levelFromCount(c: number): number {
  if (c <= 0) return 0;
  if (c <= 1) return 1;
  if (c <= 3) return 2;
  if (c <= 5) return 3;
  return 4;
}

export type HeatmapCell = {
  level: number;
  title: string;
};

export function deriveLearnerHeatmap(enrolls: Enrollment[], weeks = 12): {
  cells: HeatmapCell[];
  streakDays: number;
  hasActivity: boolean;
} {
  const now = Date.now();
  const merged = new Map<string, number>();
  for (const e of enrolls) {
    for (const [k, v] of enrollmentActivityByDay(e, now)) {
      merged.set(k, (merged.get(k) ?? 0) + v);
    }
  }
  const hasActivity = [...merged.values()].some((v) => v > 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const totalDays = weeks * 7;
  const cells: HeatmapCell[] = [];
  for (let i = totalDays; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const k = dayKey(d);
    const c = merged.get(k) ?? 0;
    const level = levelFromCount(c);
    cells.push({
      level,
      title: `${d.toLocaleDateString()}: ${c === 0 ? "No lessons completed" : `${c} learning events (from your enrollments)`}`,
    });
  }

  let streakDays = 0;
  for (let i = 0; i < 400; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const c = merged.get(dayKey(d)) ?? 0;
    if (c > 0) streakDays++;
    else break;
  }

  return { cells, streakDays, hasActivity };
}

/** Current week Mon→Sun for teen calendar (level -1 = future day). */
export function deriveTeenWeekLevels(enrolls: Enrollment[]): number[] {
  const now = Date.now();
  const merged = new Map<string, number>();
  for (const e of enrolls) {
    for (const [k, v] of enrollmentActivityByDay(e, now)) {
      merged.set(k, (merged.get(k) ?? 0) + v);
    }
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const monday = new Date(today);
  const daysSinceMon = (today.getDay() + 6) % 7;
  monday.setDate(monday.getDate() - daysSinceMon);

  const levels: number[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(d.getDate() + i);
    d.setHours(0, 0, 0, 0);
    if (d.getTime() > today.getTime()) {
      levels.push(-1);
      continue;
    }
    const c = merged.get(dayKey(d)) ?? 0;
    levels.push(levelFromCount(c));
  }
  return levels;
}
