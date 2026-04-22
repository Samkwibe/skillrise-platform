import type { Content } from "@google-cloud/vertexai";
import { VertexAI } from "@google-cloud/vertexai";

type Msg = { role: "system" | "user" | "assistant"; content: string };

/** True when project + location are set; auth via GOOGLE_APPLICATION_CREDENTIALS or gcloud ADC. */
export function isVertexTutorEnabled(): boolean {
  return Boolean(
    process.env.GOOGLE_CLOUD_PROJECT?.trim() && (process.env.GOOGLE_CLOUD_LOCATION || "us-central1").trim(),
  );
}

function toGeminiHistory(msgs: Msg[]): Content[] {
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

/**
 * Stream tutor reply using Vertex AI (Gemini). Requires GOOGLE_CLOUD_PROJECT, GOOGLE_CLOUD_LOCATION,
 * and Application Default Credentials (e.g. gcloud auth application-default login or GOOGLE_APPLICATION_CREDENTIALS).
 */
export async function streamVertexTutorReply(
  systemHistory: Msg[],
  history: Msg[],
  prompt: string,
): Promise<ReadableStream<Uint8Array>> {
  const project = process.env.GOOGLE_CLOUD_PROJECT!.trim();
  const location = (process.env.GOOGLE_CLOUD_LOCATION || "us-central1").trim();
  const modelName = (process.env.VERTEX_AI_MODEL || "gemini-2.0-flash-001").trim();

  const vertex = new VertexAI({ project, location });
  const systemInstruction = getSystemText(systemHistory);

  const generativeModel = vertex.getGenerativeModel({
    model: modelName,
    systemInstruction: systemInstruction || undefined,
    generationConfig: {
      maxOutputTokens: 1024,
      temperature: 0.5,
    },
  });

  const chatHistory = toGeminiHistory(history.slice(-12));
  const chat = generativeModel.startChat({ history: chatHistory });
  const streamResult = await chat.sendMessageStream(prompt);
  const encoder = new TextEncoder();

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const item of streamResult.stream) {
          const text = item.candidates?.[0]?.content?.parts
            ?.map((p) => ("text" in p && p.text ? p.text : ""))
            .join("");
          if (text) controller.enqueue(encoder.encode(text));
        }
      } catch (err) {
        controller.enqueue(
          encoder.encode(
            `\n\n[Vertex AI error] ${(err as Error).message?.slice(0, 200) ?? "request failed"}`,
          ),
        );
      } finally {
        controller.close();
      }
    },
  });
}

export async function vertexTutorReplyNonStreaming(
  systemHistory: Msg[],
  history: Msg[],
  prompt: string,
): Promise<string> {
  const project = process.env.GOOGLE_CLOUD_PROJECT!.trim();
  const location = (process.env.GOOGLE_CLOUD_LOCATION || "us-central1").trim();
  const modelName = (process.env.VERTEX_AI_MODEL || "gemini-2.0-flash-001").trim();

  const vertex = new VertexAI({ project, location });
  const systemInstruction = getSystemText(systemHistory);
  const generativeModel = vertex.getGenerativeModel({
    model: modelName,
    systemInstruction: systemInstruction || undefined,
    generationConfig: { maxOutputTokens: 1024, temperature: 0.5 },
  });
  const chatHistory = toGeminiHistory(history.slice(-12));
  const chat = generativeModel.startChat({ history: chatHistory });
  const result = await chat.sendMessage(prompt);
  const text = result.response.candidates?.[0]?.content?.parts
    ?.map((p) => ("text" in p && p.text ? p.text : ""))
    .join("")
    .trim();
  return text || "[No response from Vertex AI]";
}
