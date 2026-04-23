import { NextResponse } from "next/server";
import { getVerifiedUserForApi } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { getTrack } from "@/lib/store";
import { groupModulesIntoUnits } from "@/lib/course/outline";
import { applyTeacherCourseOutline, canTeacherEditCourse } from "@/lib/services/teacher-course";
import { isCourseS3Configured } from "@/lib/s3/course-assets";
import { formatZodError, teacherCourseOutlineSchema } from "@/lib/validators";
import { ensureTracksFromDatabase } from "@/lib/course/ensure-tracks";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ trackSlug: string }> },
) {
  const user = await getVerifiedUserForApi();
  if (user instanceof NextResponse) return user;
  if (user.role !== "teacher" && user.role !== "admin") {
    return NextResponse.json({ error: "Teachers only." }, { status: 403 });
  }
  const { trackSlug } = await ctx.params;
  await ensureTracksFromDatabase();
  const track = getTrack(trackSlug);
  if (!canTeacherEditCourse(user, track) || !track) {
    return NextResponse.json({ error: "Not found or access denied." }, { status: 404 });
  }

  return NextResponse.json({
    track: {
      slug: track.slug,
      title: track.title,
      weeks: track.weeks,
      level: track.level,
      category: track.category,
    },
    units: groupModulesIntoUnits(track.modules),
    s3Configured: isCourseS3Configured(),
  });
}

export async function PUT(
  req: Request,
  ctx: { params: Promise<{ trackSlug: string }> },
) {
  const user = await getVerifiedUserForApi();
  if (user instanceof NextResponse) return user;
  if (user.role !== "teacher" && user.role !== "admin") {
    return NextResponse.json({ error: "Teachers only." }, { status: 403 });
  }
  const { trackSlug } = await ctx.params;
  const track = getTrack(trackSlug);
  if (!canTeacherEditCourse(user, track) || !track) {
    return NextResponse.json({ error: "Not found or access denied." }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = teacherCourseOutlineSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid outline", details: formatZodError(parsed.error) }, { status: 400 });
  }

  const res = applyTeacherCourseOutline(trackSlug, parsed.data);
  if (!res.ok) {
    return NextResponse.json({ error: res.error }, { status: 400 });
  }

  const updated = getTrack(trackSlug);
  if (updated) {
    const db = getDb();
    await db.ready();
    await db.putTrack(updated);
  }

  return NextResponse.json({ ok: true, units: groupModulesIntoUnits(getTrack(trackSlug)!.modules) });
}
