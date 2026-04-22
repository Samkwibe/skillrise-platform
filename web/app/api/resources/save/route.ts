import { NextResponse } from "next/server";
import { findUserById, type SavedResource } from "@/lib/store";
import { getVerifiedUserForApi } from "@/lib/auth";

export const dynamic = "force-dynamic";

type Body = {
  saved?: boolean;
  resource?: Partial<SavedResource> & { id?: string };
};

/**
 * POST /api/resources/save
 *
 * Toggle-save an external learning resource (course / video / book)
 * onto the current user's profile. We persist a narrow snapshot so the
 * saved card still renders if the provider's API is later unavailable.
 *
 * Body: `{ resource: <subset of LearningResource>, saved?: boolean }`.
 * When `saved` is omitted we toggle the current state.
 *
 * Saving is limited to learners and teens. Everybody else gets 403 so
 * we don't accidentally litter employer/school accounts with saves.
 */
export async function POST(req: Request) {
  const session = await getVerifiedUserForApi();
  if (session instanceof NextResponse) return session;
  if (session.role !== "learner" && session.role !== "teen") {
    return NextResponse.json(
      { error: "Saving courses is for learners and teens." },
      { status: 403 },
    );
  }

  let body: Body = {};
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const id = body.resource?.id?.trim();
  if (!id) {
    return NextResponse.json(
      { error: "Missing resource.id" },
      { status: 400 },
    );
  }

  const target = findUserById(session.id);
  if (!target) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }
  const list = target.savedResources ?? (target.savedResources = []);
  const already = list.findIndex((r) => r.id === id);
  const want = typeof body.saved === "boolean" ? body.saved : already < 0;

  if (want && already < 0) {
    const r = body.resource ?? {};
    // Validate required fields and clamp string lengths so a malicious
    // client can't stuff the in-memory store with huge blobs.
    const title = (r.title || "").toString().slice(0, 240).trim();
    const url = (r.url || "").toString().slice(0, 1000).trim();
    const provider = (r.provider || "other").toString().slice(0, 30);
    const kind = (r.kind || "link").toString().slice(0, 16);
    if (!title || !url) {
      return NextResponse.json(
        { error: "Resource needs a title and url." },
        { status: 400 },
      );
    }
    list.unshift({
      id,
      title,
      url,
      description: r.description?.toString().slice(0, 600),
      thumbnail: r.thumbnail?.toString().slice(0, 1000),
      author: r.author?.toString().slice(0, 160),
      duration: r.duration?.toString().slice(0, 60),
      provider,
      kind,
      embedUrl: r.embedUrl?.toString().slice(0, 1000),
      freeCertificate: Boolean(r.freeCertificate),
      savedAt: Date.now(),
    });
    // Soft cap: keep the last 200 saves.
    if (list.length > 200) list.length = 200;
  } else if (!want && already >= 0) {
    list.splice(already, 1);
  }

  return NextResponse.json({
    id,
    saved: (target.savedResources ?? []).some((r) => r.id === id),
    count: (target.savedResources ?? []).length,
  });
}
