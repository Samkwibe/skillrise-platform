import { NextResponse } from "next/server";
import { getVerifiedUserForApi } from "@/lib/auth";
import { getTrack } from "@/lib/store";
import { getDb } from "@/lib/db";
import { ensureTracksFromDatabase } from "@/lib/course/ensure-tracks";
import { assertTeacher } from "@/lib/services/lms-access";
import { formatZodError, lmsTrackSettingsSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";

export async function PUT(req: Request, ctx: { params: Promise<{ trackSlug: string }> }) {
  const user = await getVerifiedUserForApi();
  if (user instanceof NextResponse) return user;
  if (user.role !== "teacher" && user.role !== "admin") {
    return NextResponse.json({ error: "Teachers only." }, { status: 403 });
  }
  const { trackSlug } = await ctx.params;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = lmsTrackSettingsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid", details: formatZodError(parsed.error) }, { status: 400 });
  }
  await ensureTracksFromDatabase();
  const track = getTrack(trackSlug);
  const denied = assertTeacher(user, track);
  if (denied) return denied;
  if (!track) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (parsed.data.prerequisiteSlugs) track.prerequisiteSlugs = parsed.data.prerequisiteSlugs;
  if (parsed.data.gradebookWeights) {
    const { assignment, quiz } = parsed.data.gradebookWeights;
    track.gradebookWeights = { assignment, quiz };
  }
  const db = getDb();
  await db.ready();
  await db.putTrack(track);
  return NextResponse.json({ track: { prerequisiteSlugs: track.prerequisiteSlugs, gradebookWeights: track.gradebookWeights } });
}
