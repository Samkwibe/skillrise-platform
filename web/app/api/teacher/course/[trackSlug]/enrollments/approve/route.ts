import { NextResponse } from "next/server";
import { getVerifiedUserForApi } from "@/lib/auth";
import { getTrack } from "@/lib/store";
import { getDb } from "@/lib/db";
import { ensureTracksFromDatabase } from "@/lib/course/ensure-tracks";
import { assertTeacher } from "@/lib/services/lms-access";
import { z } from "zod";
import { mirrorEnrollmentToStore } from "@/lib/course/enrollment-store";

export const dynamic = "force-dynamic";

const bodySchema = z.object({ userId: z.string().min(1) });

export async function POST(req: Request, ctx: { params: Promise<{ trackSlug: string }> }) {
  const user = await getVerifiedUserForApi();
  if (user instanceof NextResponse) return user;
  if (user.role !== "teacher" && user.role !== "admin") {
    return NextResponse.json({ error: "Teachers only." }, { status: 403 });
  }
  const { trackSlug } = await ctx.params;
  await ensureTracksFromDatabase();
  const track = getTrack(trackSlug);
  const denied = assertTeacher(user, track);
  if (denied) return denied;
  const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "userId required" }, { status: 400 });
  const db = getDb();
  await db.ready();
  const e = await db.getEnrollment(parsed.data.userId, trackSlug);
  if (!e) return NextResponse.json({ error: "Not found" }, { status: 404 });
  e.pendingApproval = false;
  if (e.source?.startsWith("inv_")) {
    await db.incrementInviteUse(e.source);
  }
  await db.upsertEnrollment(e);
  mirrorEnrollmentToStore(e);
  return NextResponse.json({ enrollment: e });
}
