import { NextResponse } from "next/server";
import { getVerifiedUserForApi } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { ensureTracksFromDatabase } from "@/lib/course/ensure-tracks";
import { getTrack } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ slug: string; reviewId: string }> },
) {
  const { slug, reviewId } = await ctx.params;
  const user = await getVerifiedUserForApi();
  if (user instanceof NextResponse) return user;
  await ensureTracksFromDatabase();
  if (!getTrack(slug)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const db = getDb();
  await db.ready();
  const reviews = await db.listReviewsByTrack(slug);
  const rev = reviews.find((r) => r.id === reviewId);
  if (!rev || rev.userId === user.id) {
    return NextResponse.json({ error: "Cannot vote on this review" }, { status: 400 });
  }
  const added = await db.addReviewHelpful(reviewId, user.id);
  return NextResponse.json({ ok: true, added });
}
