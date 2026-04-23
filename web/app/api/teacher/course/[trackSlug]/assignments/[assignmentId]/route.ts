import { NextResponse } from "next/server";
import { getVerifiedUserForApi } from "@/lib/auth";
import { getTrack, id } from "@/lib/store";
import { getDb } from "@/lib/db";
import { ensureTracksFromDatabase } from "@/lib/course/ensure-tracks";
import { assertTeacher } from "@/lib/services/lms-access";
import { formatZodError, lmsAssignmentPatchSchema } from "@/lib/validators";
import type { CourseAssignment } from "@/lib/course/lms-types";

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
  return NextResponse.json({ assignment: a });
}

export async function PUT(
  req: Request,
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
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = lmsAssignmentPatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid", details: formatZodError(parsed.error) }, { status: 400 });
  }
  const db = getDb();
  await db.ready();
  const a = await db.getAssignment(assignmentId);
  if (!a || a.trackSlug !== trackSlug) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const p = parsed.data;
  const next: CourseAssignment = {
    ...a,
    ...p,
    id: a.id,
    trackSlug: a.trackSlug,
    createdBy: a.createdBy,
    createdAt: a.createdAt,
    updatedAt: Date.now(),
    attachments: p.attachments
      ? p.attachments.map((x, i) => ({
          id: x.id ?? `att_${id()}_${i}`,
          title: x.title,
          url: x.url,
        }))
      : a.attachments,
  };
  await db.putAssignment(next);
  return NextResponse.json({ assignment: next });
}

export async function DELETE(
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
  await db.deleteAssignment(assignmentId);
  return NextResponse.json({ ok: true });
}
