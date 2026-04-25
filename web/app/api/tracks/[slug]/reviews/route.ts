import { NextResponse } from "next/server";
import { getVerifiedUserForApi } from "@/lib/auth";
import { getTrack, id } from "@/lib/store";
import { getDb } from "@/lib/db";
import { ensureTracksFromDatabase } from "@/lib/course/ensure-tracks";
import { courseReviewCreateSchema, formatZodError } from "@/lib/validators";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  await ensureTracksFromDatabase();
  if (!getTrack(slug)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const db = getDb();
  await db.ready();
  const reviews = await db.listReviewsByTrack(slug);
  const publicRows = await Promise.all(
    reviews.map(async (r) => {
      const u = await db.findUserById(r.userId);
      return {
        id: r.id,
        rating: r.rating,
        body: r.body,
        helpfulCount: r.helpfulCount,
        createdAt: r.createdAt,
        instructorReply: r.instructorReply,
        instructorRepliedAt: r.instructorRepliedAt,
        author: u ? { name: u.name, avatar: u.avatar } : { name: "Learner", avatar: "" },
      };
    }),
  );
  return NextResponse.json({ reviews: publicRows });
}

export async function POST(req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const user = await getVerifiedUserForApi();
  if (user instanceof NextResponse) return user;
  if (user.role === "employer" || user.role === "school") {
    return NextResponse.json({ error: "Not available" }, { status: 403 });
  }
  await ensureTracksFromDatabase();
  const track = getTrack(slug);
  if (!track) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const db = getDb();
  await db.ready();
  const enroll = await db.getEnrollment(user.id, slug);
  if (!enroll) {
    return NextResponse.json({ error: "Enroll in this course to leave a review." }, { status: 403 });
  }
  const existing = await db.getReviewByUserTrack(user.id, slug);
  if (existing) {
    return NextResponse.json({ error: "You already submitted a review for this course." }, { status: 400 });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = courseReviewCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid review", details: formatZodError(parsed.error) }, { status: 400 });
  }
  const d = parsed.data;
  const rid = `rev_${id()}`;
  const r = {
    id: rid,
    trackSlug: slug,
    userId: user.id,
    rating: d.rating,
    body: d.body,
    helpfulCount: 0,
    helpfulVoterIds: [] as string[],
    createdAt: Date.now(),
  };
  await db.putReview(r);
  const author = await db.findUserById(user.id);
  return NextResponse.json({
    review: {
      id: r.id,
      rating: r.rating,
      body: r.body,
      helpfulCount: 0,
      createdAt: r.createdAt,
      author: author ? { name: author.name, avatar: author.avatar } : null,
    },
  });
}
