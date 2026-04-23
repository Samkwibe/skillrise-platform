import { NextResponse } from "next/server";
import { getVerifiedUserForApi } from "@/lib/auth";
import { getTrack } from "@/lib/store";
import { getDb } from "@/lib/db";
import { ensureTracksFromDatabase } from "@/lib/course/ensure-tracks";
import { assertTeacher, listStudentsForTrack } from "@/lib/services/lms-access";
import { buildGradebookForTrack, gradebookToCsv, trackQuizCourseKey } from "@/lib/services/lms-gradebook";
import { formatZodError, lmsGradebookOverrideSchema } from "@/lib/validators";
import { id } from "@/lib/store";
import type { CourseGradebookOverride } from "@/lib/course/lms-types";

export const dynamic = "force-dynamic";

export async function GET(req: Request, ctx: { params: Promise<{ trackSlug: string }> }) {
  const user = await getVerifiedUserForApi();
  if (user instanceof NextResponse) return user;
  if (user.role !== "teacher" && user.role !== "admin") {
    return NextResponse.json({ error: "Teachers only." }, { status: 403 });
  }
  const { trackSlug } = await ctx.params;
  const { searchParams } = new URL(req.url);
  const format = searchParams.get("format");
  await ensureTracksFromDatabase();
  const track = getTrack(trackSlug);
  const denied = assertTeacher(user, track);
  if (denied) return denied;
  if (!track) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const db = getDb();
  await db.ready();
  const assignments = await db.listAssignmentsByTrack(trackSlug);
  const students = await listStudentsForTrack(track);
  const pairs = students.map((s) => ({ user: s.user, sectionId: s.enrollment.sectionId }));
  const rows = await buildGradebookForTrack(track, pairs, assignments);
  const courseKey = trackQuizCourseKey(trackSlug);
  const quizzes = await db.listQuizzesByCourseKey(courseKey);
  if (format === "csv" || searchParams.get("export") === "csv") {
    const csv = gradebookToCsv(
      track.title,
      assignments,
      rows,
      quizzes.map((q) => ({ id: q.id, title: q.title })),
    );
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="gradebook-${trackSlug}.csv"`,
      },
    });
  }
  return NextResponse.json({ track: { title: track.title, slug: track.slug, gradebookWeights: track.gradebookWeights }, assignments, quizzes, rows });
}

export async function PUT(req: Request, ctx: { params: Promise<{ trackSlug: string }> }) {
  const user = await getVerifiedUserForApi();
  if (user instanceof NextResponse) return user;
  if (user.role !== "teacher" && user.role !== "admin") {
    return NextResponse.json({ error: "Teachers only." }, { status: 403 });
  }
  const { trackSlug } = await ctx.params;
  await ensureTracksFromDatabase();
  const track = getTrack(trackSlug);
  const denied = assertTeacher(user, track);
  if (denied) return denied;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = lmsGradebookOverrideSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid", details: formatZodError(parsed.error) }, { status: 400 });
  }
  const db = getDb();
  await db.ready();
  const prev = await db.getGradebookOverride(trackSlug, parsed.data.userId);
  const o: CourseGradebookOverride = {
    id: prev?.id ?? `gbo_${id()}`,
    trackSlug,
    userId: parsed.data.userId,
    finalPercentOverride: parsed.data.finalPercentOverride === null ? undefined : parsed.data.finalPercentOverride,
    note: parsed.data.note,
    updatedAt: Date.now(),
    updatedBy: user.id,
  };
  const saved = await db.putGradebookOverride(o);
  return NextResponse.json({ override: saved });
}
