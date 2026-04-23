import type { Module } from "@/lib/store";

export type CourseUnitOutline = {
  id: string;
  title: string;
  lessons: Module[];
};

export function groupModulesIntoUnits(modules: Module[]): CourseUnitOutline[] {
  const order: string[] = [];
  const map = new Map<string, CourseUnitOutline>();
  for (const m of modules) {
    const uid = m.unitId || "_default";
    const title = m.unitTitle || "Course content";
    if (!map.has(uid)) {
      map.set(uid, { id: uid, title, lessons: [] });
      order.push(uid);
    }
    map.get(uid)!.lessons.push(m);
  }
  return order.map((id) => map.get(id)!);
}

export function flattenUnitsToModules(units: CourseUnitOutline[]): Module[] {
  const out: Module[] = [];
  for (const u of units) {
    for (const m of u.lessons) {
      const duration =
        m.duration ||
        (m.durationMin != null ? `${m.durationMin} min` : "15 min");
      out.push({
        ...m,
        unitId: u.id,
        unitTitle: u.title,
        duration,
      });
    }
  }
  return out;
}
