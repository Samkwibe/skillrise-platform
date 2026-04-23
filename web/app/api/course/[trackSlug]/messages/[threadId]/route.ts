import { NextResponse } from "next/server";
import { getVerifiedUserForApi } from "@/lib/auth";
import { getTrack } from "@/lib/store";
import { getDb } from "@/lib/db";
import { ensureTracksFromDatabase } from "@/lib/course/ensure-tracks";
import { assertEnrolledLearner } from "@/lib/services/lms-access";
import { canTeacherEditCourse } from "@/lib/services/teacher-course";
import type { User, Track } from "@/lib/store";

export const dynamic = "force-dynamic";

function canViewThread(u: User, track: Track, th: { teacherId: string; studentId: string; trackSlug: string }) {
  if (th.trackSlug !== track.slug) return false;
  if (u.id === th.teacherId || u.id === th.studentId) return true;
  if (u.role === "admin") return true;
  return false;
}

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ trackSlug: string; threadId: string }> },
) {
  const user = await getVerifiedUserForApi();
  if (user instanceof NextResponse) return user;
  const { trackSlug, threadId } = await ctx.params;
  await ensureTracksFromDatabase();
  const track = getTrack(trackSlug);
  if (!track) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!canTeacherEditCourse(user, track)) {
    const enr = await assertEnrolledLearner(user, track);
    if (enr) return enr;
  }
  const db = getDb();
  await db.ready();
  const th = await db.getDmThread(threadId);
  if (!th || !canViewThread(user, track, th)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const otherId = user.id === th.teacherId ? th.studentId : th.teacherId;
  const list = await db.listDmMessages(threadId);
  for (const m of list) {
    if (m.senderId === otherId && m.readByRecipientAt == null) {
      await db.putDmMessage({ ...m, readByRecipientAt: Date.now() });
    }
  }
  const messages = await db.listDmMessages(threadId);
  return NextResponse.json({ thread: th, messages });
}
