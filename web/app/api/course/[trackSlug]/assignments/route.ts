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
  const e0 = await db.getEnrollment(user.id, trackSlug);
  if (e0?.pendingApproval) {
    return NextResponse.json({ error: "Enrollment pending approval." }, { status: 403 });
  }
  const assignments = await db.listAssignmentsByTrack(trackSlug);
  const mine = await db.listSubmissionsByUserTrack(user.id, trackSlug);
  return NextResponse.json({
    assignments: assignments.map((a) => ({
      ...a,
      submission: mine.find((s) => s.assignmentId === a.id) ?? null,
    })),
  });
}
