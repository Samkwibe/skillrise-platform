import { NextResponse } from "next/server";
import { getVerifiedUserForApi } from "@/lib/auth";
import { getTrack } from "@/lib/store";
import { getDb } from "@/lib/db";
import { ensureTracksFromDatabase } from "@/lib/course/ensure-tracks";
import { assertEnrolledLearner } from "@/lib/services/lms-access";

export const dynamic = "force-dynamic";

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ trackSlug: string; threadId: string; postId: string }> },
) {
  const user = await getVerifiedUserForApi();
  if (user instanceof NextResponse) return user;
  const { trackSlug, threadId, postId } = await ctx.params;
  await ensureTracksFromDatabase();
  const track = getTrack(trackSlug);
  const enr = await assertEnrolledLearner(user, track);
  if (enr) return enr;
  const db = getDb();
  await db.ready();
  const t = await db.getForumThread(threadId);
  if (!t || t.deletedAt || t.trackSlug !== trackSlug) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const posts = await db.listForumPostsByThread(threadId);
  const p = posts.find((x) => x.id === postId);
  if (!p) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const liked = p.likedBy.includes(user.id);
  const next = { ...p, likedBy: liked ? p.likedBy.filter((x) => x !== user.id) : [...p.likedBy, user.id] };
  await db.putForumPost(next);
  return NextResponse.json({ post: next, liked: !liked });
}
