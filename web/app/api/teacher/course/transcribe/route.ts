import { NextResponse } from "next/server";
import { getVerifiedUserForApi } from "@/lib/auth";
import { getTrack } from "@/lib/store";
import { canTeacherEditCourse } from "@/lib/services/teacher-course";
import { formatZodError, teacherTranscribeRequestSchema } from "@/lib/validators";
import { ensureTracksFromDatabase } from "@/lib/course/ensure-tracks";
import { getDb } from "@/lib/db";

/**
 * Queues auto-transcription for an uploaded video (e.g. AWS Transcribe).
 * Today: flips `transcribeStatus` to pending; wire a worker + Transcribe in production.
 */
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const user = await getVerifiedUserForApi();
  if (user instanceof NextResponse) return user;
  if (user.role !== "teacher" && user.role !== "admin") {
    return NextResponse.json({ error: "Teachers only." }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = teacherTranscribeRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: formatZodError(parsed.error) }, { status: 400 });
  }

  const { trackSlug, moduleId } = parsed.data;
  await ensureTracksFromDatabase();
  const track = getTrack(trackSlug);
  if (!canTeacherEditCourse(user, track) || !track) {
    return NextResponse.json({ error: "Not found or access denied." }, { status: 404 });
  }

  const mod = track.modules.find((m) => m.id === moduleId);
  if (!mod) return NextResponse.json({ error: "Lesson not found." }, { status: 404 });
  if (!mod.s3Key) {
    return NextResponse.json({ error: "Transcription requires an uploaded file in storage (s3 key)." }, { status: 400 });
  }

  mod.transcribeStatus = "pending";
  const db = getDb();
  await db.ready();
  await db.putTrack(track);

  const fileHint = (mod.s3Key && mod.s3Key.split("/").pop()) || "lesson.mp4";
  const { transcribeCourseVideoFromS3Key } = await import("@/lib/services/video-transcribe");
  try {
    const text = await transcribeCourseVideoFromS3Key(mod.s3Key!, fileHint);
    mod.transcript = text.trim() || mod.transcript;
    mod.transcribeStatus = "ready";
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("[course transcribe]", e);
    mod.transcribeStatus = "none";
    await db.putTrack(track);
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { ok: false, error: msg },
      { status: msg.includes("OPENAI_API_KEY") || msg.includes("too large") ? 503 : 500 },
    );
  }

  await db.putTrack(track);
  return NextResponse.json({ ok: true, message: "Transcript updated from Whisper.", transcribeStatus: mod.transcribeStatus });
}
