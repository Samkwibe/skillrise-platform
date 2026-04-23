import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { getVerifiedUserForApi } from "@/lib/auth";
import { getTrack, id } from "@/lib/store";
import { getDb } from "@/lib/db";
import { ensureTracksFromDatabase } from "@/lib/course/ensure-tracks";
import { assertTeacher } from "@/lib/services/lms-access";
import { appBaseUrl } from "@/lib/email/transactional";
import { formatZodError, lmsInviteCreateSchema } from "@/lib/validators";
import type { EnrollmentInvite } from "@/lib/course/lms-types";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ trackSlug: string }> }) {
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
  const db = getDb();
  await db.ready();
  const invites = await db.listInvitesByTrack(trackSlug);
  const base = appBaseUrl();
  return NextResponse.json({
    invites: invites.map((i) => ({
      ...i,
      url: `${base}/enroll/${i.token}`,
    })),
  });
}

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
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = lmsInviteCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid", details: formatZodError(parsed.error) }, { status: 400 });
  }
  const token = randomBytes(16).toString("hex");
  const inv: EnrollmentInvite = {
    id: `inv_${id()}`,
    token,
    trackSlug,
    createdBy: user.id,
    createdAt: Date.now(),
    expiresAt: parsed.data.expiresAt,
    requireApproval: parsed.data.requireApproval,
    sectionId: parsed.data.sectionId,
    useCount: 0,
  };
  const db = getDb();
  await db.ready();
  await db.putInvite(inv);
  const base = appBaseUrl();
  return NextResponse.json({ invite: { ...inv, url: `${base}/enroll/${token}` } }, { status: 201 });
}
