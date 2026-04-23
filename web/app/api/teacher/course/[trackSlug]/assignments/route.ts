import { NextResponse } from "next/server";
import { getVerifiedUserForApi } from "@/lib/auth";
import { getTrack, id } from "@/lib/store";
import { getDb } from "@/lib/db";
import { ensureTracksFromDatabase } from "@/lib/course/ensure-tracks";
import { assertTeacher } from "@/lib/services/lms-access";
import { formatZodError, lmsAssignmentCreateSchema } from "@/lib/validators";
import type { CourseAssignment } from "@/lib/course/lms-types";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ trackSlug: string }> }) {
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
  const db = getDb();
  await db.ready();
  const list = await db.listAssignmentsByTrack(trackSlug);
  return NextResponse.json({ assignments: list });
}

export async function POST(req: Request, ctx: { params: Promise<{ trackSlug: string }> }) {
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
  const parsed = lmsAssignmentCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid assignment", details: formatZodError(parsed.error) }, { status: 400 });
  }
  const d = parsed.data;
  const db = getDb();
  await db.ready();
  const existing = await db.listAssignmentsByTrack(trackSlug);
  const now = Date.now();
  const aid = `asg_${id()}`;
  const a: CourseAssignment = {
    id: aid,
    trackSlug,
    createdBy: user.id,
    title: d.title,
    description: d.description,
    dueAt: d.dueAt,
    pointsPossible: d.pointsPossible,
    rubric: d.rubric,
    attachments: (d.attachments ?? []).map((x, i) => ({
      id: x.id ?? `att_${id()}_${i}`,
      title: x.title,
      url: x.url,
    })),
    createdAt: now,
    updatedAt: now,
    sortOrder: existing.length,
    moduleId: d.moduleId,
  };
  await db.putAssignment(a);
  return NextResponse.json({ assignment: a }, { status: 201 });
}
