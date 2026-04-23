import { NextResponse } from "next/server";
import { getVerifiedUserForApi } from "@/lib/auth";
import { getTrack, id } from "@/lib/store";
import { getDb } from "@/lib/db";
import { ensureTracksFromDatabase } from "@/lib/course/ensure-tracks";
import { assertTeacher } from "@/lib/services/lms-access";
import { formatZodError, lmsForumThreadSchema } from "@/lib/validators";
import type { CourseForumThread } from "@/lib/course/lms-types";

export const dynamic = "force-dynamic";

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
  const parsed = lmsForumThreadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid", details: formatZodError(parsed.error) }, { status: 400 });
  }
  const t: CourseForumThread = {
    id: `frt_${id()}`,
    trackSlug,
    title: parsed.data.title,
    createdBy: user.id,
    createdAt: Date.now(),
    moduleId: parsed.data.moduleId,
    pinned: false,
    closed: false,
    requirePostFirst: parsed.data.requirePostFirst,
    maxPoints: parsed.data.maxPoints,
  };
  const db = getDb();
  await db.ready();
  await db.putForumThread(t);
  return NextResponse.json({ thread: t }, { status: 201 });
}
