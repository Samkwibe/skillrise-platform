import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getVerifiedUserForApi } from "@/lib/auth";
import { teacherQuizUpdateSchema, formatZodError } from "@/lib/validators";
import { id } from "@/lib/store";
import type { QuizQuestion } from "@/lib/quiz/types";

export const dynamic = "force-dynamic";

function isTeacher(role: string) {
  return role === "teacher" || role === "admin";
}

function canEdit(userId: string, role: string, createdBy: string) {
  return role === "admin" || createdBy === userId;
}

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getVerifiedUserForApi();
  if (user instanceof NextResponse) return user;
  if (!isTeacher(user.role)) {
    return NextResponse.json({ error: "Teachers only." }, { status: 403 });
  }

  const { id } = await ctx.params;
  const db = getDb();
  const quiz = await db.getQuiz(id);
  if (!quiz) return NextResponse.json({ error: "Not found." }, { status: 404 });
  if (!canEdit(user.id, user.role, quiz.createdByUserId)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }
  return NextResponse.json({ quiz });
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getVerifiedUserForApi();
  if (user instanceof NextResponse) return user;
  if (!isTeacher(user.role)) {
    return NextResponse.json({ error: "Teachers only." }, { status: 403 });
  }

  const { id: quizId } = await ctx.params;
  const db = getDb();
  const prev = await db.getQuiz(quizId);
  if (!prev) return NextResponse.json({ error: "Not found." }, { status: 404 });
  if (!canEdit(user.id, user.role, prev.createdByUserId)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = teacherQuizUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: formatZodError(parsed.error) },
      { status: 400 },
    );
  }

  const d = parsed.data;
  let questions: QuizQuestion[] | undefined;
  if (d.questions) {
    questions = d.questions.map((q) => ({
      id: q.id?.trim() || id(),
      prompt: q.prompt,
      options: q.options,
      correctIndex: q.correctIndex,
    }));
  }

  const nextKind = d.kind ?? prev.kind;
  const merged = {
    ...prev,
    ...(d.courseKey != null ? { courseKey: d.courseKey } : {}),
    ...(d.youtubeVideoId !== undefined ? { youtubeVideoId: d.youtubeVideoId } : {}),
    ...(d.title != null ? { title: d.title } : {}),
    ...(d.kind != null ? { kind: d.kind } : {}),
    ...(d.triggerAtSec !== undefined ? { triggerAtSec: d.triggerAtSec } : {}),
    ...(d.passPct != null ? { passPct: d.passPct } : {}),
    ...(d.maxAttempts != null ? { maxAttempts: d.maxAttempts } : {}),
    ...(questions ? { questions } : {}),
    updatedAt: Date.now(),
  };

  if (nextKind === "final") {
    merged.triggerAtSec = undefined;
  } else if (nextKind === "checkpoint" && merged.triggerAtSec == null && prev.triggerAtSec != null) {
    merged.triggerAtSec = prev.triggerAtSec;
  }

  await db.putQuiz(merged);
  return NextResponse.json({ quiz: merged });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getVerifiedUserForApi();
  if (user instanceof NextResponse) return user;
  if (!isTeacher(user.role)) {
    return NextResponse.json({ error: "Teachers only." }, { status: 403 });
  }

  const { id: quizId } = await ctx.params;
  const db = getDb();
  const prev = await db.getQuiz(quizId);
  if (!prev) return NextResponse.json({ error: "Not found." }, { status: 404 });
  if (!canEdit(user.id, user.role, prev.createdByUserId)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  await db.deleteQuiz(quizId);
  return NextResponse.json({ ok: true });
}
