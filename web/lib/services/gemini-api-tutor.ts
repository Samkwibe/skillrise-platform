import { GoogleGenerativeAI } from "@google/generative-ai";
import type { Content } from "@google/generative-ai";

type Msg = { role: "system" | "user" | "assistant"; content: string };

export function getGeminiApiKey(): string | undefined {
  const k = process.env.GEMINI_API_KEY?.trim() || process.env.GOOGLE_API_KEY?.trim();
  return k || undefined;
}

export function isGeminiApiTutorEnabled(): boolean {
  return Boolean(getGeminiApiKey());
}

function toContentHistory(msgs: Msg[]): Content[] {
  const out: Content[] = [];
  for (const m of msgs) {
    if (m.role === "system") continue;
    if (m.role === "user") {
      out.push({ role: "user", parts: [{ text: m.content }] });
    } else if (m.role === "assistant") {
      out.push({ role: "model", parts: [{ text: m.content }] });
    }
  }
  return out;
}

function getSystemText(systemMessages: Msg[]): string {
  return systemMessages.find((m) => m.role === "system")?.content ?? "";
}

function modelName(): string {
  // Default 2.5-flash — 2.0-flash often hits free-tier quota on AI Studio keys; override with GEMINI_API_MODEL.
  return (process.env.GEMINI_API_MODEL || "gemini-2.5-flash").trim();
}

/**
 * Time limit for the first text token in streaming mode (overridable; min 1s).
 * If exceeded, the promise rejects so callers (e.g. OpenAI fallback) can run.
 */
function streamFirstTokenTimeoutMs(): number {
  const n = Number(process.env.GEMINI_STREAM_FIRST_TOKEN_MS ?? "60000");
  if (!Number.isFinite(n) || n < 1000) return 60_000;
  return n;
}

/**
 * Same setup as {@link streamGeminiApiTutorReply}, but the returned promise
 * **rejects** if `sendMessageStream` fails, the first token is late (timeout),
 * or the model returns an empty message — so a caller can try another backend.
 * Mid-stream errors are still appended as text, then the stream closes.
 */
export async function streamGeminiApiTutorReply(
  systemHistory: Msg[],
  history: Msg[],
  prompt: string,
): Promise<ReadableStream<Uint8Array>> {
  return streamGeminiApiTutorReplyStrictInternal(systemHistory, history, prompt);
}

async function streamGeminiApiTutorReplyStrictInternal(
  systemHistory: Msg[],
  history: Msg[],
  prompt: string,
): Promise<ReadableStream<Uint8Array>> {
  const apiKey = getGeminiApiKey()!;
  const genAI = new GoogleGenerativeAI(apiKey);
  const systemText = getSystemText(systemHistory);
  const m = genAI.getGenerativeModel({
    model: modelName(),
    systemInstruction: systemText || undefined,
    generationConfig: { maxOutputTokens: 1024, temperature: 0.5 },
  });
  const chat = m.startChat({ history: toContentHistory(history.slice(-12)) });
  const result = await chat.sendMessageStream(prompt);
  const encoder = new TextEncoder();
  const it = result.stream[Symbol.asyncIterator]();
  const firstParts: string[] = [];
  const deadline = Date.now() + streamFirstTokenTimeoutMs();

  while (Date.now() < deadline) {
    const { value, done } = await it.next();
    if (done) {
      throw new Error("Gemini returned an empty response");
    }
    let t: string;
    try {
      t = value.text();
    } catch (e) {
      throw e instanceof Error ? e : new Error(String(e));
    }
    if (t) {
      firstParts.push(t);
      break;
    }
  }

  if (firstParts.length === 0) {
    const timedOut = Date.now() >= deadline;
    throw new Error(
      timedOut
        ? "Gemini timed out before the first response token"
        : "Gemini returned an empty response",
    );
  }

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for (const s of firstParts) {
          controller.enqueue(encoder.encode(s));
        }
        for await (const chunk of asyncIteratorWithRest(it)) {
          try {
            const t = chunk.text();
            if (t) controller.enqueue(encoder.encode(t));
          } catch {
            // partial / safety — skip bad chunks
          }
        }
      } catch (err) {
        controller.enqueue(
          encoder.encode(
            `\n\n[Gemini API error] ${(err as Error).message?.slice(0, 200) ?? "request failed"}`,
          ),
        );
      } finally {
        controller.close();
      }
    },
  });
}

/** Yields the remaining values from a partially consumed async iterator. */
async function* asyncIteratorWithRest<T>(it: AsyncIterator<T>) {
  let n: IteratorResult<T, undefined>;
  while (!(n = await it.next()).done) {
    yield n.value;
  }
}

export async function geminiApiTutorReplyNonStreaming(
  systemHistory: Msg[],
  history: Msg[],
  prompt: string,
): Promise<string> {
  const apiKey = getGeminiApiKey()!;
  const genAI = new GoogleGenerativeAI(apiKey);
  const m = genAI.getGenerativeModel({
    model: modelName(),
    systemInstruction: getSystemText(systemHistory) || undefined,
    generationConfig: { maxOutputTokens: 1024, temperature: 0.5 },
  });
  const chat = m.startChat({ history: toContentHistory(history.slice(-12)) });
  const result = await chat.sendMessage(prompt);
  const t = result.response.text();
  return t?.trim() || "[No response from Gemini]";
}
