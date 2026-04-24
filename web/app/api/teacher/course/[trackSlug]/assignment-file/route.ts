import { NextResponse } from "next/server";
import { getVerifiedUserForApi } from "@/lib/auth";
import { getTrack } from "@/lib/store";
import { ensureTracksFromDatabase } from "@/lib/course/ensure-tracks";
import { assertTeacher } from "@/lib/services/lms-access";
import { isCourseS3Configured, presignGetObject } from "@/lib/s3/course-assets";

export const dynamic = "force-dynamic";

const PREFIX = (slug: string) => `courses/${slug}/assignment-submissions/`;

/**
 * Teacher-only: short-lived signed GET URL to open a learner’s submission file from S3.
 */
export async function GET(req: Request, ctx: { params: Promise<{ trackSlug: string }> }) {
  const user = await getVerifiedUserForApi();
  if (user instanceof NextResponse) return user;
  if (user.role !== "teacher" && user.role !== "admin") {
    return NextResponse.json({ error: "Teachers only." }, { status: 403 });
  }
  const { trackSlug } = await ctx.params;
  const { searchParams } = new URL(req.url);
  const key = searchParams.get("key")?.trim();
  if (!key) {
    return NextResponse.json({ error: "key query required" }, { status: 400 });
  }
  await ensureTracksFromDatabase();
  const track = getTrack(trackSlug);
  const denied = assertTeacher(user, track);
  if (denied) return denied;
  if (!isCourseS3Configured()) {
    return NextResponse.json({ error: "S3 not configured." }, { status: 503 });
  }
  if (!key.startsWith(PREFIX(trackSlug))) {
    return NextResponse.json({ error: "Invalid file key for this course." }, { status: 400 });
  }
  try {
    const url = await presignGetObject(key, 3600);
    return NextResponse.redirect(url, 302);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("[assignment-file]", e);
    return NextResponse.json({ error: "Could not sign download URL." }, { status: 500 });
  }
}
