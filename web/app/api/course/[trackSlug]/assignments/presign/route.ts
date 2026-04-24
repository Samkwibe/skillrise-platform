import { NextResponse } from "next/server";
import { getVerifiedUserForApi } from "@/lib/auth";
import { getTrack } from "@/lib/store";
import { getDb } from "@/lib/db";
import { ensureTracksFromDatabase } from "@/lib/course/ensure-tracks";
import { assertEnrolledLearner } from "@/lib/services/lms-access";
import {
  isAllowedAssignmentSubmissionContentType,
  isCourseS3Configured,
  makeAssignmentSubmissionObjectKey,
  presignPutObject,
} from "@/lib/s3/course-assets";
import { formatZodError, assignmentSubmissionPresignSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";

export async function POST(req: Request, ctx: { params: Promise<{ trackSlug: string }> }) {
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
    return NextResponse.json({ error: "Enrollment pending approval." }, { status: 403 });
  }

  if (!isCourseS3Configured()) {
    return NextResponse.json(
      {
        error: "File uploads are not configured.",
        hint: "Set SKILLRISE_COURSE_BUCKET (or AWS_S3_COURSE_BUCKET) and AWS credentials.",
      },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = assignmentSubmissionPresignSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: formatZodError(parsed.error) }, { status: 400 });
  }
  const { fileName, contentType } = parsed.data;
  if (!isAllowedAssignmentSubmissionContentType(contentType)) {
    return NextResponse.json(
      { error: "Allowed: PDF, Word, Excel, PowerPoint, text, or common images (PNG, JPEG, WebP, GIF)." },
      { status: 400 },
    );
  }

  const key = makeAssignmentSubmissionObjectKey(trackSlug, user.id, fileName);
  try {
    const out = await presignPutObject({ key, contentType });
    return NextResponse.json({ uploadUrl: out.uploadUrl, key: out.key, bucket: out.bucket });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("[assignment presign]", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Could not create upload URL." },
      { status: 500 },
    );
  }
}
