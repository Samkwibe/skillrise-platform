import OpenAI, { toFile } from "openai";
import { getObjectBuffer } from "@/lib/s3/course-assets";

const MAX_BYTES = 24 * 1024 * 1024; // below Whisper API 25MB limit; large uploads may need a worker + ffmpeg

/**
 * Transcribe course video audio using OpenAI Whisper. Requires OPENAI_API_KEY and S3 object access.
 */
export async function transcribeCourseVideoFromS3Key(s3Key: string, fileNameHint = "lesson.mp4"): Promise<string> {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) {
    throw new Error("OPENAI_API_KEY is not set — cannot run Whisper transcription.");
  }
  const buf = await getObjectBuffer(s3Key);
  if (buf.length > MAX_BYTES) {
    throw new Error(
      `File is too large for inline Whisper transcription (${(buf.length / 1024 / 1024).toFixed(1)}MB). ` +
        `Use a shorter clip or run a self-hosted transcode pipeline first.`,
    );
  }
  const client = new OpenAI({ apiKey: key });
  const safeName = fileNameHint.replace(/[^\w.+-]+/g, "_").slice(0, 80) || "lesson.mp4";
  const file = await toFile(buf, safeName);
  const out = await client.audio.transcriptions.create({
    file,
    model: "whisper-1",
  });
  return typeof out === "string" ? out : (out as { text?: string }).text ?? "";
}
