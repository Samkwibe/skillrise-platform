import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import type { LearningHubCourseState } from "@/lib/store";
import { getVerifiedUserForApi } from "@/lib/auth";
import { learningHubPatchSchema, formatZodError } from "@/lib/validators";
import { stableCourseId } from "@/lib/courses/ids";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const session = await getVerifiedUserForApi();
  if (session instanceof NextResponse) return session;
  const key = new URL(req.url).searchParams.get("key");
  if (!key) return NextResponse.json({ error: "Missing key" }, { status: 400 });
  const db = getDb();
  const u = await db.findUserById(session.id);
  if (!u) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const state = u.learningHubByCourse?.[key] ?? null;
  return NextResponse.json({ state });
}

export async function PATCH(req: Request) {
  const session = await getVerifiedUserForApi();
  if (session instanceof NextResponse) return session;
  if (session.role !== "learner" && session.role !== "teen") {
    return NextResponse.json({ error: "Learners only." }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = learningHubPatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: formatZodError(parsed.error) },
      { status: 400 },
    );
  }

  const expected = stableCourseId(parsed.data.provider, parsed.data.url);
  if (parsed.data.key !== expected) {
    return NextResponse.json({ error: "Key does not match provider + url." }, { status: 400 });
  }

  const db = getDb();
  const target = await db.findUserById(session.id);
  if (!target) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const hub = { ...(target.learningHubByCourse ?? {}) };
  const prev = hub[parsed.data.key];
  const next: LearningHubCourseState = {
    provider: parsed.data.provider,
    title: parsed.data.title,
    url: parsed.data.url,
    imageUrl: parsed.data.imageUrl ?? prev?.imageUrl,
    primaryVideoId: parsed.data.primaryVideoId ?? prev?.primaryVideoId,
    lastPositionSec: parsed.data.lastPositionSec ?? prev?.lastPositionSec,
    videoDurationSec: parsed.data.videoDurationSec ?? prev?.videoDurationSec,
    progressPct: parsed.data.progressPct ?? prev?.progressPct ?? 0,
    completed: parsed.data.completed ?? prev?.completed ?? false,
    notes: parsed.data.notes ?? prev?.notes ?? [],
    updatedAt: Date.now(),
  };
  hub[parsed.data.key] = next;

  const saved = target.savedExternalCourses?.length
    ? [...target.savedExternalCourses]
    : undefined;
  if (saved) {
    const i = saved.findIndex((c) => c.id === parsed.data.key);
    if (i >= 0) {
      const row = { ...saved[i]! };
      row.progressPct = next.progressPct;
      if (next.lastPositionSec != null) row.lastPositionSec = next.lastPositionSec;
      saved[i] = row;
    }
  }

  await db.updateUser(session.id, {
    learningHubByCourse: hub,
    ...(saved ? { savedExternalCourses: saved } : {}),
  });

  return NextResponse.json({ state: next });
}
