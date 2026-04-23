import { NextResponse } from "next/server";
import { getVerifiedUserForApi } from "@/lib/auth";
import { getTrack } from "@/lib/store";
import { getDb } from "@/lib/db";
import { ensureTracksFromDatabase } from "@/lib/course/ensure-tracks";
import { assertTeacher } from "@/lib/services/lms-access";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ trackSlug: string; assignmentId: string }> },
) {
  const user = await getVerifiedUserForApi();
  if (user instanceof NextResponse) return user;
  if (user.role !== "teacher" && user.role !== "admin") {
    return NextResponse.json({ error: "Teachers only." }, { status: 403 });
  }
  const { trackSlug, assignmentId } = await ctx.params;
  await ensureTracksFromDatabase();
  const track = getTrack(trackSlug);
  const denied = assertTeacher(user, track);
  if (denied) return denied;
  const db = getDb();
  await db.ready();
  const a = await db.getAssignment(assignmentId);
  if (!a || a.trackSlug !== trackSlug) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const subs = await db.listSubmissionsByAssignment(assignmentId);
  const submissions = await Promise.all(
    subs.map(async (s) => {
      const u = await db.findUserById(s.userId);
      return { ...s, studentName: u?.name ?? "Unknown", studentEmail: u?.email };
    }),
  );
  return NextResponse.json({ submissions, assignment: a });
}
