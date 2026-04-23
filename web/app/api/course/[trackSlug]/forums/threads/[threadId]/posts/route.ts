import { NextResponse } from "next/server";
import { getVerifiedUserForApi } from "@/lib/auth";
import { getTrack, id } from "@/lib/store";
import { getDb } from "@/lib/db";
import { ensureTracksFromDatabase } from "@/lib/course/ensure-tracks";
import { assertEnrolledLearner, userMuted } from "@/lib/services/lms-access";
import { formatZodError, lmsForumPostSchema } from "@/lib/validators";
import type { CourseForumPost } from "@/lib/course/lms-types";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ trackSlug: string; threadId: string }> },
) {
  const user = await getVerifiedUserForApi();
  if (user instanceof NextResponse) return user;
  const { trackSlug, threadId } = await ctx.params;
  await ensureTracksFromDatabase();
  const track = getTrack(trackSlug);
  if (!track) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const enr = await assertEnrolledLearner(user, track);
  if (enr) return enr;
  const db = getDb();
  await db.ready();
  const t = await db.getForumThread(threadId);
  if (!t || t.deletedAt || t.trackSlug !== trackSlug) return NextResponse.json({ error: "Not found" }, { status: 404 });
  let posts = await db.listForumPostsByThread(threadId);
  if (t.requirePostFirst && user.id !== track.teacherId) {
    const hasMine = posts.some((p) => p.userId === user.id);
    if (!hasMine) {
      return NextResponse.json({ thread: t, posts: [], requirePostFirst: true as const });
    }
  }
  posts = posts.filter((p) => !userMuted(p.userId, user));
  return NextResponse.json({ thread: t, posts, requirePostFirst: false as const });
}

export async function POST(
  req: Request,
  ctx: { params: Promise<{ trackSlug: string; threadId: string }> },
) {
  const user = await getVerifiedUserForApi();
  if (user instanceof NextResponse) return user;
  const { trackSlug, threadId } = await ctx.params;
  await ensureTracksFromDatabase();
  const track = getTrack(trackSlug);
  if (!track) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const enr = await assertEnrolledLearner(user, track);
  if (enr) return enr;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = lmsForumPostSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid", details: formatZodError(parsed.error) }, { status: 400 });
  }
  const db = getDb();
  await db.ready();
  const t = await db.getForumThread(threadId);
  if (!t || t.deletedAt || t.trackSlug !== trackSlug) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (t.closed && user.id !== track.teacherId) {
    return NextResponse.json({ error: "Thread is closed." }, { status: 400 });
  }
  const p: CourseForumPost = {
    id: `frp_${id()}`,
    threadId,
    trackSlug,
    userId: user.id,
    body: parsed.data.body,
    at: Date.now(),
    parentPostId: parsed.data.parentPostId,
    likedBy: [],
  };
  await db.putForumPost(p);
  return NextResponse.json({ post: p }, { status: 201 });
}
