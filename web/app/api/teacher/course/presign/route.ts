import { NextResponse } from "next/server";
import { getVerifiedUserForApi } from "@/lib/auth";
import { getTrack } from "@/lib/store";
import {
  isAllowedMaterialContentType,
  isAllowedVideoContentType,
  isCourseS3Configured,
  makeCourseObjectKey,
  presignPutObject,
} from "@/lib/s3/course-assets";
import { canTeacherEditCourse } from "@/lib/services/teacher-course";
import { formatZodError, teacherCoursePresignSchema } from "@/lib/validators";
import { ensureTracksFromDatabase } from "@/lib/course/ensure-tracks";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const user = await getVerifiedUserForApi();
  if (user instanceof NextResponse) return user;
  if (user.role !== "teacher" && user.role !== "admin") {
    return NextResponse.json({ error: "Teachers only." }, { status: 403 });
  }

  await ensureTracksFromDatabase();
  if (!isCourseS3Configured()) {
    return NextResponse.json(
      {
        error: "Course file uploads are not configured.",
        hint: "Set SKILLRISE_COURSE_BUCKET (or AWS_S3_COURSE_BUCKET) and AWS region/credentials, or use YouTube and external links in the builder.",
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

  const parsed = teacherCoursePresignSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: formatZodError(parsed.error) }, { status: 400 });
  }

  const { trackSlug, fileName, contentType, kind } = parsed.data;
  const track = getTrack(trackSlug);
  if (!canTeacherEditCourse(user, track)) {
    return NextResponse.json({ error: "Not allowed for this course." }, { status: 403 });
  }

  if (kind === "video" && !isAllowedVideoContentType(contentType)) {
    return NextResponse.json(
      { error: "Use MP4, WebM, or QuickTime (MOV) for video uploads." },
      { status: 400 },
    );
  }
  if (kind === "material" && !isAllowedMaterialContentType(contentType)) {
    return NextResponse.json(
      { error: "Unsupported document type. Use PDF, Office docs, or similar." },
      { status: 400 },
    );
  }
  if (kind === "thumbnail" && !contentType.toLowerCase().startsWith("image/")) {
    return NextResponse.json({ error: "Thumbnails must be an image/* type." }, { status: 400 });
  }

  const sub = kind === "video" ? "videos" : kind === "thumbnail" ? "thumbnails" : "materials";
  const key = makeCourseObjectKey(sub, trackSlug, fileName);

  try {
    const out = await presignPutObject({ key, contentType });
    return NextResponse.json({ uploadUrl: out.uploadUrl, key: out.key, bucket: out.bucket });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("[course presign]", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Could not create upload URL." },
      { status: 500 },
    );
  }
}
