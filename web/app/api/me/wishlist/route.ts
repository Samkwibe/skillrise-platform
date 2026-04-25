import { NextResponse } from "next/server";
import { getVerifiedUserForApi } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { getTrack } from "@/lib/store";
import { ensureTracksFromDatabase } from "@/lib/course/ensure-tracks";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getVerifiedUserForApi();
  if (user instanceof NextResponse) return user;
  const db = getDb();
  await db.ready();
  const list = await db.listWishlist(user.id);
  return NextResponse.json({ wishlist: list });
}

export async function POST(req: Request) {
  const user = await getVerifiedUserForApi();
  if (user instanceof NextResponse) return user;
  if (user.role === "employer" || user.role === "school") {
    return NextResponse.json({ error: "Not available for this account." }, { status: 403 });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const trackSlug = typeof (body as { trackSlug?: string })?.trackSlug === "string" ? (body as { trackSlug: string }).trackSlug : "";
  if (!trackSlug) {
    return NextResponse.json({ error: "trackSlug required" }, { status: 400 });
  }
  await ensureTracksFromDatabase();
  if (!getTrack(trackSlug)) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 });
  }
  const db = getDb();
  await db.ready();
  await db.addWishlist(user.id, trackSlug);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const user = await getVerifiedUserForApi();
  if (user instanceof NextResponse) return user;
  const trackSlug = new URL(req.url).searchParams.get("trackSlug");
  if (!trackSlug) {
    return NextResponse.json({ error: "trackSlug query required" }, { status: 400 });
  }
  const db = getDb();
  await db.ready();
  await db.removeWishlist(user.id, trackSlug);
  return NextResponse.json({ ok: true });
}
