import { NextResponse } from "next/server";
import { getVerifiedUserForApi } from "@/lib/auth";
import { getTrack } from "@/lib/store";
import { getDb } from "@/lib/db";
import { ensureTracksFromDatabase } from "@/lib/course/ensure-tracks";
import { assertEnrolledLearner } from "@/lib/services/lms-access";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ trackSlug: string }> }) {
  const user = await getVerifiedUserForApi();
  if (user instanceof NextResponse) return user;
  const { trackSlug } = await ctx.params;
  await ensureTracksFromDatabase();
  const track = getTrack(trackSlug);
  const enr = await assertEnrolledLearner(user, track);
  if (enr) return enr;
  const db = getDb();
  await db.ready();
  if ((await db.getEnrollment(user.id, trackSlug))?.pendingApproval) {
    return NextResponse.json({ error: "Enrollment pending" }, { status: 403 });
  }
  const list = (await db.listAnnouncementsByTrack(trackSlug)).slice().sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return b.createdAt - a.createdAt;
  });
  const withRead = await Promise.all(
    list.map(async (a) => ({
      ...a,
      read: await db.isAnnouncementRead(a.id, user.id),
    })),
  );
  return NextResponse.json({ announcements: withRead });
}
