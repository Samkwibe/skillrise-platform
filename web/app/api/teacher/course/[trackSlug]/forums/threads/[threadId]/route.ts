import { NextResponse } from "next/server";
import { getVerifiedUserForApi } from "@/lib/auth";
import { getTrack } from "@/lib/store";
import { getDb } from "@/lib/db";
import { ensureTracksFromDatabase } from "@/lib/course/ensure-tracks";
import { assertTeacher } from "@/lib/services/lms-access";
import { z } from "zod";

const patchSchema = z.object({
  pinned: z.boolean().optional(),
  closed: z.boolean().optional(),
  deleted: z.boolean().optional(),
});

export const dynamic = "force-dynamic";

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ trackSlug: string; threadId: string }> },
) {
  const user = await getVerifiedUserForApi();
  if (user instanceof NextResponse) return user;
  if (user.role !== "teacher" && user.role !== "admin") {
    return NextResponse.json({ error: "Teachers only." }, { status: 403 });
  }
  const { trackSlug, threadId } = await ctx.params;
  await ensureTracksFromDatabase();
  const track = getTrack(trackSlug);
  const denied = assertTeacher(user, track);
  if (denied) return denied;
  const parsed = patchSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });
  const db = getDb();
  await db.ready();
  const t = await db.getForumThread(threadId);
  if (!t || t.trackSlug !== trackSlug) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (parsed.data.pinned !== undefined) t.pinned = parsed.data.pinned;
  if (parsed.data.closed !== undefined) t.closed = parsed.data.closed;
  if (parsed.data.deleted) t.deletedAt = Date.now();
  await db.putForumThread(t);
  return NextResponse.json({ thread: t });
}
