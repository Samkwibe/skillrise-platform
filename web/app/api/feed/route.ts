import { NextResponse } from "next/server";
import { store, id, type LifeCategory, type FeedPost } from "@/lib/store";
import { getVerifiedUserForApi } from "@/lib/auth";

const VALID_CATEGORIES: LifeCategory[] = [
  "communication",
  "mental-health",
  "financial-literacy",
  "job-readiness",
  "trades",
  "home-life",
  "digital-basics",
  "tech",
  "care",
  "youth",
];

export async function GET() {
  const posts = [...store.feed].sort((a, b) => b.createdAt - a.createdAt);
  return NextResponse.json({ posts });
}

export async function POST(req: Request) {
  const user = await getVerifiedUserForApi();
  if (user instanceof NextResponse) return user;
  if (user.role !== "teacher" && user.role !== "admin") {
    return NextResponse.json({ error: "Only teachers can post lessons." }, { status: 403 });
  }
  const { title, description, emoji, duration, youth, trackSlug, category, takeaway } = await req.json();
  if (!title || !description) {
    return NextResponse.json({ error: "Title and description required." }, { status: 400 });
  }
  // Enforce the educational-only rule at the API boundary. A feed post
  // without a category = a feed post without a lesson. Reject it.
  if (!category || !VALID_CATEGORIES.includes(category)) {
    return NextResponse.json(
      { error: "Please choose a life-skill category so learners know what they'll take away." },
      { status: 400 },
    );
  }
  const post: FeedPost = {
    id: `f_${id()}`,
    authorId: user.id,
    title,
    description,
    emoji: emoji || "🎓",
    duration: duration || "3 min",
    likes: 0,
    comments: [],
    youth: Boolean(youth),
    trackSlug: trackSlug || undefined,
    category,
    takeaway: typeof takeaway === "string" && takeaway.trim() ? takeaway.trim() : undefined,
    createdAt: Date.now(),
  };
  store.feed.unshift(post);
  return NextResponse.json({ post }, { status: 201 });
}
