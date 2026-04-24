import { NextResponse } from "next/server";
import { getVerifiedUserForApi } from "@/lib/auth";
import { getTrack } from "@/lib/store";
import { ensureTracksFromDatabase } from "@/lib/course/ensure-tracks";
import { assertEnrolledLearner } from "@/lib/services/lms-access";
import { getDb } from "@/lib/db";
import { isCourseS3Configured, presignGetObject } from "@/lib/s3/course-assets";

export const dynamic = "force-dynamic";

const ownPrefix = (slug: string, userId: string) => `courses/${slug}/assignment-submissions/${userId}/`;

/**
 * Learner: download own submission file (key must be under this user’s assignment-submissions prefix).
 */
export async function GET(req: Request, ctx: { params: Promise<{ trackSlug: string }> }) {
  const user = await getVerifiedUserForApi();
  if (user instanceof NextResponse) return user;
  const { trackSlug } = await ctx.params;
  const { searchParams } = new URL(req.url);
  const key = searchParams.get("key")?.trim();
  if (!key) {
    return NextResponse.json({ error: "key query required" }, { status: 400 });
  }
  await ensureTracksFromDatabase();
  const track = getTrack(trackSlug);
  const enr = await assertEnrolledLearner(user, track);
  if (enr) return enr;
  if (!key.startsWith(ownPrefix(trackSlug, user.id))) {
    return NextResponse.json({ error: "Not allowed for this file." }, { status: 403 });
  }
  const db = getDb();
  await db.ready();
  if ((await db.getEnrollment(user.id, trackSlug))?.pendingApproval) {
    return NextResponse.json({ error: "Enrollment pending." }, { status: 403 });
  }
  if (!isCourseS3Configured()) {
    return NextResponse.json({ error: "S3 not configured." }, { status: 503 });
  }
  try {
    const url = await presignGetObject(key, 3600);
    return NextResponse.redirect(url, 302);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("[learner assignment-file]", e);
    return NextResponse.json({ error: "Could not sign download URL." }, { status: 500 });
  }
}
