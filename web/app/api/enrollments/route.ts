import { NextResponse } from "next/server";
import { getTrack, id, type Enrollment } from "@/lib/store";
import { getVerifiedUserForApi } from "@/lib/auth";
import { ensureTracksFromDatabase, getTrackLoaded } from "@/lib/course/ensure-tracks";
import { getDb } from "@/lib/db";
import { mirrorEnrollmentToStore } from "@/lib/course/enrollment-store";

export async function GET() {
  const user = await getVerifiedUserForApi();
  if (user instanceof NextResponse) return user;
  const db = getDb();
  await db.ready();
  const enrollments = await db.listEnrollments(user.id);
  for (const e of enrollments) mirrorEnrollmentToStore(e);
  return NextResponse.json({ enrollments });
}

export async function POST(req: Request) {
  const user = await getVerifiedUserForApi();
  if (user instanceof NextResponse) return user;
  await ensureTracksFromDatabase();
  const body = (await req.json()) as {
    trackSlug?: string;
    inviteToken?: string;
    sectionId?: string;
  };
  const trackSlug = body.trackSlug;
  if (!trackSlug) return NextResponse.json({ error: "trackSlug required" }, { status: 400 });
  const track = await getTrackLoaded(trackSlug);
  if (!track) return NextResponse.json({ error: "Unknown track." }, { status: 404 });

  const db = getDb();
  await db.ready();
  const existing = await db.getEnrollment(user.id, trackSlug);
  if (existing) {
    mirrorEnrollmentToStore(existing);
    return NextResponse.json({ enrollment: existing });
  }

  let pendingApproval = false;
  let source: string | undefined;
  let sectionId = body.sectionId;
  if (body.inviteToken) {
    const inv = await db.getInviteByToken(body.inviteToken);
    if (!inv || inv.trackSlug !== trackSlug) {
      return NextResponse.json({ error: "Invalid or expired enrollment link." }, { status: 400 });
    }
    if (inv.expiresAt && inv.expiresAt < Date.now()) {
      return NextResponse.json({ error: "This enrollment link has expired." }, { status: 400 });
    }
    pendingApproval = inv.requireApproval;
    source = inv.id;
    if (inv.sectionId) sectionId = inv.sectionId;
    if (!pendingApproval) {
      await db.incrementInviteUse(inv.id);
    }
  }

  const enrollment: Enrollment = {
    id: `e_${id()}`,
    userId: user.id,
    trackSlug,
    startedAt: Date.now(),
    completedModuleIds: [],
    sectionId: sectionId || undefined,
    source,
    pendingApproval: pendingApproval || undefined,
  };
  await db.upsertEnrollment(enrollment);
  mirrorEnrollmentToStore(enrollment);
  return NextResponse.json({ enrollment }, { status: 201 });
}
