import { NextResponse } from "next/server";
import { getVerifiedUserForApi } from "@/lib/auth";
import { getTrack } from "@/lib/store";
import { getDb } from "@/lib/db";
import { ensureTracksFromDatabase } from "@/lib/course/ensure-tracks";
import { assertEnrolledLearner } from "@/lib/services/lms-access";

export const dynamic = "force-dynamic";

export async function GET(req: Request, ctx: { params: Promise<{ trackSlug: string }> }) {
  const user = await getVerifiedUserForApi();
  if (user instanceof NextResponse) return user;
  const { trackSlug } = await ctx.params;
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim().toLowerCase();
  await ensureTracksFromDatabase();
  const track = getTrack(trackSlug);
  const enr = await assertEnrolledLearner(user, track);
  if (enr) return enr;
  const db = getDb();
  await db.ready();
  let list = (await db.listForumThreadsByTrack(trackSlug)).filter((t) => !t.deletedAt);
  if (q) list = list.filter((t) => t.title.toLowerCase().includes(q));
  list = list.sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return b.createdAt - a.createdAt;
  });
  return NextResponse.json({ threads: list });
}
