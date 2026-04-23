import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getVerifiedUserForApi } from "@/lib/auth";
import { teacherQuizCreateSchema, formatZodError } from "@/lib/validators";
import { id } from "@/lib/store";
import type { Quiz, QuizQuestion } from "@/lib/quiz/types";

export const dynamic = "force-dynamic";

function isTeacher(role: string) {
  return role === "teacher" || role === "admin";
}

export async function GET(req: Request) {
  const user = await getVerifiedUserForApi();
  if (user instanceof NextResponse) return user;
  if (!isTeacher(user.role)) {
    return NextResponse.json({ error: "Teachers only." }, { status: 403 });
  }

  const courseKey = new URL(req.url).searchParams.get("courseKey")?.trim();
  if (!courseKey) {
    return NextResponse.json({ error: "Missing courseKey query param." }, { status: 400 });
  }

  const db = getDb();
  const all = await db.listQuizzesByCourseKey(courseKey);
  const quizzes = all.filter((q) => q.createdByUserId === user.id || user.role === "admin");
  return NextResponse.json({ quizzes });
}

export async function POST(req: Request) {
  const user = await getVerifiedUserForApi();
  if (user instanceof NextResponse) return user;
  if (!isTeacher(user.role)) {
    return NextResponse.json({ error: "Teachers only." }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = teacherQuizCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: formatZodError(parsed.error) },
      { status: 400 },
    );
  }

  const d = parsed.data;
  const now = Date.now();
  const questions: QuizQuestion[] = d.questions.map((q) => ({
    id: q.id?.trim() || id(),
    prompt: q.prompt,
    options: q.options,
    correctIndex: q.correctIndex,
  }));

  const quiz: Quiz = {
    id: id(),
    courseKey: d.courseKey,
    youtubeVideoId: d.youtubeVideoId,
    title: d.title,
    kind: d.kind,
    triggerAtSec: d.kind === "checkpoint" ? d.triggerAtSec : undefined,
    questions,
    passPct: d.passPct,
    maxAttempts: d.maxAttempts,
    createdByUserId: user.id,
    createdAt: now,
    updatedAt: now,
  };

  const db = getDb();
  await db.putQuiz(quiz);
  return NextResponse.json({ quiz });
}
