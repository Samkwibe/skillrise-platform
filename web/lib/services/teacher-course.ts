import type { User } from "@/lib/store";
import type { Track, Module } from "@/lib/store";
import { getTrack } from "@/lib/store";
import { flattenUnitsToModules, type CourseUnitOutline } from "@/lib/course/outline";
import { teacherCourseOutlineSchema } from "@/lib/validators";
import type { z } from "zod";

export type CourseOutlineInput = z.infer<typeof teacherCourseOutlineSchema>;

export function canTeacherEditCourse(user: User, track: Track | undefined): boolean {
  if (!track) return false;
  if (user.role === "admin") return true;
  return user.role === "teacher" && track.teacherId === user.id;
}

function normalizeModules(mods: Module[]): Module[] {
  const now = Date.now();
  return mods.map((m) => ({
    ...m,
    materials: m.materials?.map((x) => ({
      ...x,
      createdAt: x.createdAt ?? now,
    })),
  }));
}

/**
 * Replaces the flat `track.modules` list from a nested unit → lessons editor.
 */
export function applyTeacherCourseOutline(trackSlug: string, outline: CourseOutlineInput): { ok: true } | { ok: false; error: string } {
  const track = getTrack(trackSlug);
  if (!track) return { ok: false, error: "Track not found" };
  const units = outline.units as unknown as CourseUnitOutline[];
  const flat = normalizeModules(flattenUnitsToModules(units));
  if (flat.length === 0) {
    return { ok: false, error: "Add at least one lesson." };
  }
  track.modules = flat;
  return { ok: true };
}
