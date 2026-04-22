import { NextResponse } from "next/server";
import { findUserById } from "@/lib/store";
import { getVerifiedUserForApi } from "@/lib/auth";
import { savedExternalCourseBodySchema, savedExternalProgressSchema, formatZodError } from "@/lib/validators";
import { stableCourseId } from "@/lib/courses/ids";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getVerifiedUserForApi();
  if (user instanceof NextResponse) return user;
  const u = findUserById(user.id);
  if (!u) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return NextResponse.json({ courses: u.savedExternalCourses ?? [] });
}

export async function POST(req: Request) {
  const user = await getVerifiedUserForApi();
  if (user instanceof NextResponse) return user;
  const target = findUserById(user.id);
  if (!target) return NextResponse.json({ error: "Not found." }, { status: 404 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = savedExternalCourseBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: formatZodError(parsed.error) },
      { status: 400 },
    );
  }

  const id = stableCourseId(parsed.data.provider, parsed.data.url);
  const list = target.savedExternalCourses ?? [];
  if (list.some((c) => c.id === id)) {
    return NextResponse.json({ ok: true, courses: list });
  }

  list.push({
    id,
    provider: parsed.data.provider,
    title: parsed.data.title,
    url: parsed.data.url,
    imageUrl: parsed.data.imageUrl,
    description: parsed.data.description,
    progressPct: 0,
    savedAt: Date.now(),
  });
  target.savedExternalCourses = list;

  return NextResponse.json({ ok: true, courses: list });
}

export async function PATCH(req: Request) {
  const user = await getVerifiedUserForApi();
  if (user instanceof NextResponse) return user;
  const target = findUserById(user.id);
  if (!target) return NextResponse.json({ error: "Not found." }, { status: 404 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = savedExternalProgressSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: formatZodError(parsed.error) },
      { status: 400 },
    );
  }

  const list = target.savedExternalCourses ?? [];
  const row = list.find((c) => c.id === parsed.data.id);
  if (!row) return NextResponse.json({ error: "Not saved." }, { status: 404 });
  row.progressPct = parsed.data.progressPct;
  return NextResponse.json({ ok: true, courses: list });
}

export async function DELETE(req: Request) {
  const user = await getVerifiedUserForApi();
  if (user instanceof NextResponse) return user;
  const target = findUserById(user.id);
  if (!target) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const list = (target.savedExternalCourses ?? []).filter((c) => c.id !== id);
  target.savedExternalCourses = list;
  return NextResponse.json({ ok: true, courses: list });
}
