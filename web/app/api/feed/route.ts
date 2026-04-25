import { NextResponse } from "next/server";
import { store, id, type LifeCategory, type FeedPost } from "@/lib/store";
import { getVerifiedUserForApi } from "@/lib/auth";
import { persistFeedPost } from "@/lib/feed/persist-feed-post";
import { classifyVideoUrl } from "@/lib/feed/video-embed";

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

function canPostFeedRole(role: string) {
  return role === "learner" || role === "teen" || role === "teacher" || role === "admin";
}

function normalizeVideoUrl(raw: unknown): string | undefined {
  if (raw == null || typeof raw !== "string") return undefined;
  const s = raw.trim();
  if (!s) return undefined;
  if (s.length > 2000) return undefined;
  try {
    const u = new URL(s);
    if (u.protocol !== "https:" && u.protocol !== "http:") return undefined;
    const { type } = classifyVideoUrl(s);
    if (type === "none" && !s.match(/\.(mp4|webm|ogv)(\?|$)/i)) {
      return undefined;
    }
    return s;
  } catch {
    return undefined;
  }
}

export async function GET() {
  const posts = [...store.feed].sort((a, b) => b.createdAt - a.createdAt);
  return NextResponse.json({ posts });
}

export async function POST(req: Request) {
  const user = await getVerifiedUserForApi();
  if (user instanceof NextResponse) return user;
  if (!canPostFeedRole(user.role)) {
    return NextResponse.json({ error: "Your account type cannot post to SkillFeed." }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const title = typeof body.title === "string" ? body.title.trim() : "";
  const description = typeof body.description === "string" ? body.description.trim() : "";
  if (!title || !description) {
    return NextResponse.json({ error: "Title and description required." }, { status: 400 });
  }

  const category = body.category as LifeCategory | undefined;
  if (!category || !VALID_CATEGORIES.includes(category)) {
    return NextResponse.json(
      { error: "Please choose a life-skill category so learners know what they'll take away." },
      { status: 400 },
    );
  }

  const videoRaw = body.videoUrl;
  const videoUrl = normalizeVideoUrl(videoRaw);
  if (typeof videoRaw === "string" && videoRaw.trim() && !videoUrl) {
    return NextResponse.json(
      {
        error:
          "Video link must be a public HTTPS URL: YouTube, Vimeo, or a direct .mp4/.webm file.",
      },
      { status: 400 },
    );
  }

  const takeaway =
    typeof body.takeaway === "string" && body.takeaway.trim() ? String(body.takeaway).trim().slice(0, 500) : undefined;
  const emoji = typeof body.emoji === "string" && body.emoji.trim() ? body.emoji.trim().slice(0, 8) : "🎓";
  const duration = typeof body.duration === "string" && body.duration.trim() ? body.duration.trim().slice(0, 32) : "3 min";
  const trackSlug =
    typeof body.trackSlug === "string" && body.trackSlug.trim() ? body.trackSlug.trim() : undefined;

  const youth = user.role === "teen" ? true : Boolean(body.youth);

  const post: FeedPost = {
    id: `f_${id()}`,
    authorId: user.id,
    title: title.slice(0, 200),
    description: description.slice(0, 5000),
    emoji,
    duration,
    likes: 0,
    comments: [],
    youth,
    trackSlug,
    category,
    takeaway,
    videoUrl: videoUrl || undefined,
    createdAt: Date.now(),
  };

  store.feed.unshift(post);
  await persistFeedPost(post);
  return NextResponse.json({ post }, { status: 201 });
}
