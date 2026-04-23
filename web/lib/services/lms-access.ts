import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import type { User, Track, Enrollment } from "@/lib/store";
import { canTeacherEditCourse } from "@/lib/services/teacher-course";

export function isCourseStudent(user: User, track: Track): boolean {
  if (user.id === track.teacherId) return false;
  if (user.role === "admin") return false;
  return true;
}

export async function getEnrollmentForCourse(userId: string, trackSlug: string): Promise<Enrollment | null> {
  const db = getDb();
  await db.ready();
  return db.getEnrollment(userId, trackSlug);
}

/**
 * Learners enrolled in the course (for rosters, gradebook, announcement email).
 */
export async function listStudentsForTrack(track: Track): Promise<{ user: User; enrollment: Enrollment }[]> {
  const db = getDb();
  await db.ready();
  const rows = await db.listEnrollmentsByTrack(track.slug);
  const out: { user: User; enrollment: Enrollment }[] = [];
  for (const e of rows) {
    const u = await db.findUserById(e.userId);
    if (!u) continue;
    if (!isCourseStudent(u, track)) continue;
    out.push({ user: u, enrollment: e });
  }
  return out;
}

export function assertTeacher(user: User, track: Track | undefined): NextResponse | null {
  if (!track || !canTeacherEditCourse(user, track)) {
    return NextResponse.json({ error: "Not found or access denied." }, { status: 404 });
  }
  return null;
}

export async function assertEnrolledLearner(user: User, track: Track | undefined): Promise<NextResponse | null> {
  if (!track) {
    return NextResponse.json({ error: "Course not found." }, { status: 404 });
  }
  const e = await getEnrollmentForCourse(user.id, track.slug);
  if (!e) {
    return NextResponse.json({ error: "Enroll in this course to continue." }, { status: 403 });
  }
  return null;
}

export function userMuted(otherId: string, viewer: User): boolean {
  return Boolean(viewer.mutedUserIds?.includes(otherId));
}
