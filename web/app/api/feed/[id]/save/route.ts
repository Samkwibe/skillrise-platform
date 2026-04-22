import { NextResponse } from "next/server";
import { store } from "@/lib/store";
import { getVerifiedUserForApi } from "@/lib/auth";

export const dynamic = "force-dynamic";

type RouteCtx = { params: Promise<{ id: string }> };

/**
 * POST /api/feed/[id]/save
 *
 * Toggle the "saved" state of a feed post for the current user.
 * Body: `{ "saved": boolean }` — explicit so the UI can stay idempotent
 *        even if the user double-taps.
 * Only learners and teens can save. Teachers already have their own
 * content surface; employers and schools don't use the feed.
 */
export async function POST(req: Request, ctx: RouteCtx) {
  const { id } = await ctx.params;
  const user = await getVerifiedUserForApi();
  if (user instanceof NextResponse) return user;
  if (user.role !== "learner" && user.role !== "teen") {
    return NextResponse.json(
      { error: "Saving lessons is for learners and teens." },
      { status: 403 },
    );
  }

  const post = store.feed.find((p) => p.id === id);
  if (!post) return NextResponse.json({ error: "Post not found." }, { status: 404 });
  if (user.role === "teen" && !post.youth) {
    return NextResponse.json({ error: "Not available for your account." }, { status: 403 });
  }

  let body: { saved?: unknown } = {};
  try {
    body = await req.json();
  } catch {
    // Body is optional. Fall through to toggle.
  }

  const savedBy = post.savedBy ?? (post.savedBy = []);
  const already = savedBy.includes(user.id);
  const want = typeof body.saved === "boolean" ? body.saved : !already;

  if (want && !already) savedBy.push(user.id);
  else if (!want && already) post.savedBy = savedBy.filter((u) => u !== user.id);

  return NextResponse.json({
    id: post.id,
    saved: Boolean((post.savedBy ?? []).includes(user.id)),
    savedCount: (post.savedBy ?? []).length,
  });
}
