import { NextResponse } from "next/server";
import { getVerifiedUserForApi } from "@/lib/auth";
import { teacherAssistantAskSchema, formatZodError } from "@/lib/validators";
import { rateLimit, clientKey, rateLimitHeaders } from "@/lib/security/rate-limit";
import {
  streamAssistantReplyWithSystem,
  assistantReplyNonStreamingWithSystem,
} from "@/lib/services/assistant-service";
import { buildTeacherAssistantSystemPrompt } from "@/lib/services/teacher-assistant-prompt";
import type { AssistantChatMsg } from "@/lib/services/assistant-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function isTeacherOrAdmin(role: string) {
  return role === "teacher" || role === "admin";
}

export async function POST(req: Request) {
  const user = await getVerifiedUserForApi();
  if (user instanceof NextResponse) return user;
  if (!isTeacherOrAdmin(user.role)) {
    return NextResponse.json({ error: "Teachers and admins only." }, { status: 403 });
  }

  const limit = rateLimit(clientKey(req, `teacher-assistant:${user.id}`), 30, 60 * 60 * 1000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Rate limited. Try again soon." },
      { status: 429, headers: rateLimitHeaders(limit) },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = teacherAssistantAskSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: formatZodError(parsed.error) },
      { status: 400 },
    );
  }

  const { prompt, history, stream } = parsed.data;
  const systemPrompt = buildTeacherAssistantSystemPrompt(user);
  const h = (history as AssistantChatMsg[]).map((m) => ({
    role: m.role,
    content: m.content,
  }));

  if (stream) {
    const clientStream = await streamAssistantReplyWithSystem({
      user,
      systemPrompt,
      prompt,
      history: h,
    });
    return new Response(clientStream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Accel-Buffering": "no",
        ...rateLimitHeaders(limit),
      },
    });
  }

  const text = await assistantReplyNonStreamingWithSystem({
    user,
    systemPrompt,
    prompt,
    history: h,
  });
  return NextResponse.json({ reply: text }, { headers: rateLimitHeaders(limit) });
}
