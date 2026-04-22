import { NextResponse } from "next/server";
import { getVerifiedUserForApi } from "@/lib/auth";
import {
  getCommunityRoom,
  listCommunityMessages,
  appendCommunityMessage,
  findUserById,
  id,
  type CommunityMessage,
} from "@/lib/store";
import { communityMessageSchema, formatZodError } from "@/lib/validators";
import { rateLimit, clientKey, rateLimitHeaders } from "@/lib/security/rate-limit";
import { analyzeContent, needsSupportNudge } from "@/lib/apify/content-processor";

export const dynamic = "force-dynamic";

// Simple client-side profanity/slur guard. Intentionally permissive — the
// goal is to block the obvious, not to moderate nuance. Teachers + admins
// review flagged content via /admin.
const BANNED = [/\bkill your\w*\b/i, /\bsuicid\w*\b/i, /\brape\b/i, /\bslur1\b/i];
function softFlag(text: string) {
  return BANNED.some((r) => r.test(text));
}

type RouteCtx = { params: Promise<{ roomId: string }> };

/** GET messages for a room (respecting teen-safety). */
export async function GET(_req: Request, ctx: RouteCtx) {
  const { roomId } = await ctx.params;
  const user = await getVerifiedUserForApi();
  if (user instanceof NextResponse) return user;

  const room = getCommunityRoom(roomId);
  if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });
  if (user.role === "teen" && !room.teenSafe) {
    return NextResponse.json({ error: "Not available for your account." }, { status: 403 });
  }

  const messages = listCommunityMessages(room.id, 150).map((m) => {
    const author = findUserById(m.userId);
    return {
      ...m,
      author: author
        ? { id: author.id, name: author.name, role: author.role, avatar: author.avatar }
        : null,
    };
  });
  return NextResponse.json({ room, messages });
}

/** POST a message. Rate-limited per-user to prevent flood. */
export async function POST(req: Request, ctx: RouteCtx) {
  const { roomId } = await ctx.params;
  const user = await getVerifiedUserForApi();
  if (user instanceof NextResponse) return user;

  const limit = rateLimit(clientKey(req, `community:${user.id}`), 20, 60 * 1000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "You're posting quickly. Take a breath." },
      { status: 429, headers: rateLimitHeaders(limit) },
    );
  }

  const room = getCommunityRoom(roomId);
  if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });
  if (user.role === "teen" && !room.teenSafe) {
    return NextResponse.json({ error: "Not available for your account." }, { status: 403 });
  }
  // Employers + schools are not supposed to use chat in v1. Block politely.
  if (user.role === "employer" || user.role === "school") {
    return NextResponse.json(
      { error: "Community chat is for learners, teens, and teachers." },
      { status: 403 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = communityMessageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: formatZodError(parsed.error) },
      { status: 400 },
    );
  }

  const hidden = softFlag(parsed.data.text);
  const msg: CommunityMessage = {
    id: `cmm_${id()}`,
    roomId: room.id,
    userId: user.id,
    text: parsed.data.text,
    at: Date.now(),
    hidden: hidden || undefined,
  };
  appendCommunityMessage(msg);
  if (hidden) {
    return NextResponse.json(
      { error: "Your message was flagged for review. A moderator will look at it." },
      { status: 202 },
    );
  }

  // Best-effort sentiment/topic check via the Apify AI content processor.
  // Runs in the request path so the client can surface a support card
  // alongside the user's message when we detect something crisis-adjacent.
  // Any failure (rate limit, network, missing keys) degrades silently.
  let supportNudge: { message: string; tips: string[] } | null = null;
  try {
    const analysis = await analyzeContent(parsed.data.text, {
      tasks: ["sentiment", "classification"],
    });
    if (needsSupportNudge(analysis)) {
      supportNudge = {
        message:
          "That sounds heavy. You're not alone — would it help to talk to someone?",
        tips: [
          "988 Suicide & Crisis Lifeline (US): call or text 988",
          "Crisis Text Line: text HOME to 741741",
          "Or pick a quieter room like Calm Corner to breathe it out",
        ],
      };
    }
  } catch {
    // Moderation is optional; never block a legitimate message on it.
  }

  const author = findUserById(user.id);
  return NextResponse.json({
    message: {
      ...msg,
      author: author
        ? { id: author.id, name: author.name, role: author.role, avatar: author.avatar }
        : null,
    },
    supportNudge,
  });
}
