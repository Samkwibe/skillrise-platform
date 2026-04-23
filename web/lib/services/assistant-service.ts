import OpenAI from "openai";
import type { User } from "@/lib/store";
import { userEnrollments, getTrack, type Track } from "@/lib/store";
import { ensureTracksFromDatabase } from "@/lib/course/ensure-tracks";
import {
  isVertexTutorEnabled,
  streamVertexTutorReply,
  vertexTutorReplyNonStreaming,
} from "@/lib/services/vertex-tutor";
import {
  isGeminiApiTutorEnabled,
  streamGeminiApiTutorReply,
  geminiApiTutorReplyNonStreaming,
} from "@/lib/services/gemini-api-tutor";

export type AssistantChatMsg = { role: "system" | "user" | "assistant"; content: string };
type Msg = AssistantChatMsg;

function systemPrompt(user: User, track: Track | null): string {
  const neighborhood = user.neighborhood || "your neighborhood";
  return `You are the SkillRise AI Tutor — a warm, practical, no-fluff mentor for someone building real-world skills.

Learner profile:
- Name: ${user.name}
- Role: ${user.role}
- Neighborhood: ${neighborhood}
${user.bio ? `- Bio: ${user.bio}` : ""}
${track ? `- Active track: ${track.title} (${track.level}, ${track.weeks} weeks)\n- Modules: ${track.modules.map((m) => m.title).join("; ")}\n- Skills: ${track.skills.join(", ")}` : "- Not yet enrolled in a track."}

Style rules:
- Keep answers short (1–4 short paragraphs or a tight numbered list).
- Explain concepts step-by-step, starting from what the learner already knows.
- Offer to quiz them, simulate an interview, or go deeper on any step.
- Use real numbers and concrete examples (hourly wages, wire gauges, interest rates).
- If the question is off-topic, gently redirect back to their goals.
- Never invent credentials, pricing, or laws you aren't sure about — say "check with a local mentor" instead.
- Be encouraging. The learner may be working full-time while studying. Respect their time.`;
}

function mockReply(q: string, trackTitle: string | null): string {
  const lc = q.toLowerCase();
  if (/quiz|test me/.test(lc)) {
    return `Quick quiz${trackTitle ? ` on ${trackTitle}` : ""}:\n\n1) What is the first thing you do before touching a panel?\n2) Name three PPE items required for residential work.\n3) When should you use a Wago vs a wire nut?\n\nReply with your answers and I'll score them.`;
  }
  if (/budget|money/.test(lc)) {
    return "Start with a zero-based budget: every dollar has a job before it leaves. For most people on $15–25/hr: rent ≤35%, food + transport ≤25%, emergency fund ≥10% until you hit $500. Want me to draft a real budget with your numbers?";
  }
  if (/interview|apprentice/.test(lc)) {
    return "Let's practice. Imagine I'm a shop owner. First question: \"Tell me about a time you had to do something uncomfortable because it was the right thing to do.\" Give me 3–5 sentences and I'll coach you.";
  }
  if (/ohm|electric|volt|amp/.test(lc)) {
    return "Ohm's law: V = I × R. Voltage pushes, current flows, resistance resists. Fix R, double V → current doubles. Want a hands-on example with a 12V battery?";
  }
  return `Here's how I'd break that down${trackTitle ? ` in the context of your ${trackTitle} track` : ""}:\n\n1) Focus on the one thing that moves the needle today.\n2) Separate what you know from what you need to look up.\n3) Come back with a specific question — quiz, interview prep, or concept deep-dive.\n\n(Set GEMINI_API_KEY (AI Studio, primary) and optionally OPENAI_API_KEY for automatic fallback, or Vertex — see .env.local.)`;
}

type TutorBackend = "openai" | "gemini_openai" | "vertex" | "none";

/** Picks model: AI_TUTOR_PROVIDER, else gemini+OpenAI fallback (when key present) > openai > vertex. */
function resolveTutorProvider(): TutorBackend {
  const p = process.env.AI_TUTOR_PROVIDER?.toLowerCase().trim();
  if (p === "openai") {
    return process.env.OPENAI_API_KEY ? "openai" : "none";
  }
  if (p === "vertex" || p === "vertexai") {
    return isVertexTutorEnabled() ? "vertex" : "none";
  }
  if (p === "gemini" || p === "aistudio" || p === "google_ai") {
    if (isGeminiApiTutorEnabled()) return "gemini_openai";
    return "none";
  }
  if (p === "google") {
    if (isGeminiApiTutorEnabled()) return "gemini_openai";
    if (isVertexTutorEnabled()) return "vertex";
    return "none";
  }
  if (isGeminiApiTutorEnabled()) return "gemini_openai";
  if (process.env.OPENAI_API_KEY) return "openai";
  if (isVertexTutorEnabled()) return "vertex";
  return "none";
}

function geminiNonStreamRequestTimeoutMs(): number {
  const n = Number(process.env.GEMINI_REQUEST_TIMEOUT_MS ?? "120000");
  if (!Number.isFinite(n) || n < 5000) return 120_000;
  return n;
}

function withRequestTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(label)), ms);
    promise.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      },
    );
  });
}

function streamTextMessage(text: string): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(text));
      controller.close();
    },
  });
}

async function streamOpenAITutorReply(
  systemHistory: Msg[],
  history: Msg[],
  prompt: string,
  model: string,
): Promise<ReadableStream<Uint8Array>> {
  const apiKey = process.env.OPENAI_API_KEY!;
  const openai = new OpenAI({ apiKey });
  const messages: Msg[] = [
    ...systemHistory,
    ...history.slice(-12),
    { role: "user", content: prompt },
  ];
  const completion = await openai.chat.completions.create({
    model,
    stream: true,
    temperature: 0.5,
    max_tokens: 700,
    messages,
  });
  const encoder = new TextEncoder();
  return new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of completion) {
          const delta = chunk.choices?.[0]?.delta?.content;
          if (delta) controller.enqueue(encoder.encode(delta));
        }
      } catch (err) {
        controller.enqueue(
          encoder.encode(
            `\n\n[Tutor error — falling back] ${(err as Error).message?.slice(0, 120) ?? ""}`,
          ),
        );
      }
      controller.close();
    },
  });
}

async function openAITutorText(
  systemHistory: Msg[],
  history: Msg[],
  prompt: string,
  model: string,
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY!;
  const openai = new OpenAI({ apiKey });
  const completion = await openai.chat.completions.create({
    model,
    temperature: 0.5,
    max_tokens: 700,
    messages: [...systemHistory, ...history.slice(-12), { role: "user", content: prompt }],
  });
  return completion.choices[0]?.message?.content?.trim() ?? "";
}

export function getAssistantContext(user: User): { track: Track | null; history: Msg[] } {
  const enrolls = userEnrollments(user.id);
  const track = enrolls[0] ? getTrack(enrolls[0].trackSlug) ?? null : null;
  return { track, history: [{ role: "system", content: systemPrompt(user, track) }] };
}

export async function streamAssistantReply({
  user,
  prompt,
  history,
}: {
  user: User;
  prompt: string;
  history: Msg[];
}): Promise<ReadableStream<Uint8Array>> {
  await ensureTracksFromDatabase();
  const { track, history: systemHistory } = getAssistantContext(user);
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  const backend = resolveTutorProvider();

  const encoder = new TextEncoder();

  if (backend === "none") {
    const reply = mockReply(prompt, track?.title ?? null);
    return new ReadableStream({
      async start(controller) {
        for (const chunk of reply.match(/.{1,14}/g) || [reply]) {
          controller.enqueue(encoder.encode(chunk));
          await new Promise((r) => setTimeout(r, 25));
        }
        controller.close();
      },
    });
  }

  if (backend === "vertex") {
    return streamVertexTutorReply(systemHistory, history, prompt);
  }

  if (backend === "gemini_openai") {
    if (isGeminiApiTutorEnabled()) {
      try {
        return await streamGeminiApiTutorReply(systemHistory, history, prompt);
      } catch (err) {
        if (process.env.OPENAI_API_KEY) {
          return await streamOpenAITutorReply(systemHistory, history, prompt, model);
        }
        const msg = (err as Error).message?.slice(0, 200) ?? "request failed";
        return streamTextMessage(
          `Tutor: Gemini is unavailable (${msg}). ` +
            "Set OPENAI_API_KEY for automatic fallback, or check GEMINI_API_KEY and quotas.",
        );
      }
    }
    if (process.env.OPENAI_API_KEY) {
      return await streamOpenAITutorReply(systemHistory, history, prompt, model);
    }
    return streamTextMessage(
      "Tutor: set GEMINI_API_KEY (primary) and optionally OPENAI_API_KEY for automatic fallback.",
    );
  }

  if (backend === "openai") {
    return await streamOpenAITutorReply(systemHistory, history, prompt, model);
  }

  return streamTextMessage("Tutor: no model configured. Set GEMINI_API_KEY and/or OPENAI_API_KEY in .env.local.");
}

/** Same backends as the learner tutor, but with a custom system prompt (e.g. teacher AI). */
export async function streamAssistantReplyWithSystem({
  systemPrompt,
  prompt,
  history,
}: {
  user: User;
  systemPrompt: string;
  prompt: string;
  history: Msg[];
}): Promise<ReadableStream<Uint8Array>> {
  const systemHistory: Msg[] = [{ role: "system", content: systemPrompt }];
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  const backend = resolveTutorProvider();
  const encoder = new TextEncoder();

  if (backend === "none") {
    const reply = mockReply(prompt, null);
    return new ReadableStream({
      async start(controller) {
        for (const chunk of reply.match(/.{1,14}/g) || [reply]) {
          controller.enqueue(encoder.encode(chunk));
          await new Promise((r) => setTimeout(r, 25));
        }
        controller.close();
      },
    });
  }

  if (backend === "vertex") {
    return streamVertexTutorReply(systemHistory, history, prompt);
  }

  if (backend === "gemini_openai") {
    if (isGeminiApiTutorEnabled()) {
      try {
        return await streamGeminiApiTutorReply(systemHistory, history, prompt);
      } catch (err) {
        if (process.env.OPENAI_API_KEY) {
          return await streamOpenAITutorReply(systemHistory, history, prompt, model);
        }
        const msg = (err as Error).message?.slice(0, 200) ?? "request failed";
        return streamTextMessage(
          `Assistant: Gemini is unavailable (${msg}). Set OPENAI_API_KEY for fallback.`,
        );
      }
    }
    if (process.env.OPENAI_API_KEY) {
      return await streamOpenAITutorReply(systemHistory, history, prompt, model);
    }
    return streamTextMessage("Set GEMINI_API_KEY and/or OPENAI_API_KEY.");
  }

  if (backend === "openai") {
    return await streamOpenAITutorReply(systemHistory, history, prompt, model);
  }

  return streamTextMessage("No model configured. Set GEMINI_API_KEY and/or OPENAI_API_KEY.");
}

export async function assistantReplyNonStreamingWithSystem({
  systemPrompt,
  prompt,
  history,
}: {
  user: User;
  systemPrompt: string;
  prompt: string;
  history: Msg[];
}): Promise<string> {
  const systemHistory: Msg[] = [{ role: "system", content: systemPrompt }];
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  const backend = resolveTutorProvider();

  if (backend === "none") return mockReply(prompt, null);

  if (backend === "vertex") {
    return vertexTutorReplyNonStreaming(systemHistory, history, prompt);
  }

  if (backend === "gemini_openai") {
    if (isGeminiApiTutorEnabled()) {
      try {
        const text = await withRequestTimeout(
          geminiApiTutorReplyNonStreaming(systemHistory, history, prompt),
          geminiNonStreamRequestTimeoutMs(),
          "Gemini request timed out",
        );
        const trimmed = text?.trim();
        if (trimmed && !/^\[No response from Gemini\]$/.test(trimmed)) {
          return trimmed;
        }
        throw new Error(trimmed || "Gemini returned an empty response");
      } catch (err) {
        if (process.env.OPENAI_API_KEY) {
          const t = await openAITutorText(systemHistory, history, prompt, model);
          return t || mockReply(prompt, null);
        }
        return `Assistant: Gemini unavailable (${(err as Error).message?.slice(0, 200) ?? "error"}).`;
      }
    }
    if (process.env.OPENAI_API_KEY) {
      const t = await openAITutorText(systemHistory, history, prompt, model);
      return t || mockReply(prompt, null);
    }
    return "Set GEMINI_API_KEY and/or OPENAI_API_KEY.";
  }

  const t = await openAITutorText(systemHistory, history, prompt, model);
  return t || mockReply(prompt, null);
}

export async function assistantReplyNonStreaming({
  user,
  prompt,
  history,
}: {
  user: User;
  prompt: string;
  history: Msg[];
}): Promise<string> {
  await ensureTracksFromDatabase();
  const { track, history: systemHistory } = getAssistantContext(user);
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  const backend = resolveTutorProvider();

  if (backend === "none") return mockReply(prompt, track?.title ?? null);
  if (backend === "vertex") {
    return vertexTutorReplyNonStreaming(systemHistory, history, prompt);
  }

  if (backend === "gemini_openai") {
    if (isGeminiApiTutorEnabled()) {
      try {
        const text = await withRequestTimeout(
          geminiApiTutorReplyNonStreaming(systemHistory, history, prompt),
          geminiNonStreamRequestTimeoutMs(),
          "Gemini request timed out",
        );
        const trimmed = text?.trim();
        if (trimmed && !/^\[No response from Gemini\]$/.test(trimmed)) {
          return trimmed;
        }
        throw new Error(trimmed || "Gemini returned an empty response");
      } catch (err) {
        if (process.env.OPENAI_API_KEY) {
          const t = await openAITutorText(systemHistory, history, prompt, model);
          return t || mockReply(prompt, track?.title ?? null);
        }
        return (
          `Tutor: Gemini is unavailable (${(err as Error).message?.slice(0, 200) ?? "request failed"}). ` +
          "Set OPENAI_API_KEY for automatic fallback, or check GEMINI_API_KEY and quotas."
        );
      }
    }
    if (process.env.OPENAI_API_KEY) {
      const t = await openAITutorText(systemHistory, history, prompt, model);
      return t || mockReply(prompt, track?.title ?? null);
    }
    return "Tutor: set GEMINI_API_KEY (primary) and optionally OPENAI_API_KEY for automatic fallback.";
  }

  const t = await openAITutorText(systemHistory, history, prompt, model);
  return t || mockReply(prompt, track?.title ?? null);
}
