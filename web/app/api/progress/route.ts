import { NextResponse } from "next/server";
import { getTrack, id, type Certificate } from "@/lib/store";
import { getVerifiedUserForApi } from "@/lib/auth";
import { ensureTracksFromDatabase } from "@/lib/course/ensure-tracks";
import { getDb } from "@/lib/db";
import { mirrorEnrollmentToStore, mirrorCertificateToStore } from "@/lib/course/enrollment-store";

export async function POST(req: Request) {
  const user = await getVerifiedUserForApi();
  if (user instanceof NextResponse) return user;
  await ensureTracksFromDatabase();
  const { trackSlug, moduleId } = await req.json();
  const track = getTrack(trackSlug);
  if (!track) return NextResponse.json({ error: "Unknown track." }, { status: 404 });
  if (!track.modules.some((m) => m.id === moduleId)) {
    return NextResponse.json({ error: "Unknown module." }, { status: 404 });
  }
  const db = getDb();
  await db.ready();
  const enrollment = await db.getEnrollment(user.id, trackSlug);
  if (!enrollment) return NextResponse.json({ error: "Not enrolled." }, { status: 400 });
  if (enrollment.pendingApproval) {
    return NextResponse.json({ error: "Your enrollment is pending instructor approval." }, { status: 403 });
  }

  if (!enrollment.completedModuleIds.includes(moduleId)) {
    enrollment.completedModuleIds = [...enrollment.completedModuleIds, moduleId];
  }
  const done = enrollment.completedModuleIds.length === track.modules.length;
  let newCertificate: Certificate | null = null;
  if (done && !enrollment.completedAt) {
    enrollment.completedAt = Date.now();
    newCertificate = {
      id: `cert_${id()}`,
      userId: user.id,
      trackSlug,
      issuedAt: Date.now(),
      score: 85 + Math.floor(Math.random() * 14),
      verifiable: true,
    };
    await db.createCertificate(newCertificate);
    mirrorCertificateToStore(newCertificate);
  }
  await db.upsertEnrollment(enrollment);
  mirrorEnrollmentToStore(enrollment);
  return NextResponse.json({ enrollment, done, certificate: newCertificate });
}
