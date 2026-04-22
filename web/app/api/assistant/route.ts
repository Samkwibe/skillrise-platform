import { NextResponse } from "next/server";
import { id } from "@/lib/store";
import { getVerifiedUserForApi } from "@/lib/auth";
import { assistantAskSchema, formatZodError } from "@/lib/validators";
import {
  streamAssistantReply,
  assistantReplyNonStreaming,
} from "@/lib/services/assistant-service";
import { rateLimit, clientKey, rateLimitHeaders } from "@/lib/security/rate-limit";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  const user = await getVerifiedUserForApi();
  if (user instanceof NextResponse) return user;

  const limit = rateLimit(clientKey(req, `assistant:${user.id}`), 40, 60 * 60 * 1000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Rate limited. Tutor is cooling down." },
      { status: 429, headers: rateLimitHeaders(limit) },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = assistantAskSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: formatZodError(parsed.error) },
      { status: 400 },
    );
  }

  const { prompt, history, stream } = parsed.data;
  const db = getDb();

  await db.appendAssistantMessage({
    id: `am_${id()}`,
    userId: user.id,
    role: "user",
    text: prompt,
    at: Date.now(),
  });

  if (stream) {
    const body = await streamAssistantReply({ user, prompt, history });
    // Tee the stream so we can persist the full reply after streaming finishes.
    const [clientStream, persistStream] = body.tee();
    (async () => {
      const reader = persistStream.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
      }
      acc += decoder.decode();
      if (acc.trim()) {
        await db.appendAssistantMessage({
          id: `am_${id()}`,
          userId: user.id,
          role: "assistant",
          text: acc,
          at: Date.now(),
        });
      }
    })().catch(() => {});

    return new Response(clientStream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Accel-Buffering": "no",
        ...rateLimitHeaders(limit),
      },
    });
  }

  const text = await assistantReplyNonStreaming({ user, prompt, history });
  await db.appendAssistantMessage({
    id: `am_${id()}`,
    userId: user.id,
    role: "assistant",
    text,
    at: Date.now(),
  });
  return NextResponse.json({ reply: text }, { headers: rateLimitHeaders(limit) });
}
