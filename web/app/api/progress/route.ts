import { NextResponse } from "next/server";
import { store, getTrack, id } from "@/lib/store";
import { getVerifiedUserForApi } from "@/lib/auth";

export async function POST(req: Request) {
  const user = await getVerifiedUserForApi();
  if (user instanceof NextResponse) return user;
  const { trackSlug, moduleId } = await req.json();
  const track = getTrack(trackSlug);
  if (!track) return NextResponse.json({ error: "Unknown track." }, { status: 404 });
  if (!track.modules.some((m) => m.id === moduleId)) {
    return NextResponse.json({ error: "Unknown module." }, { status: 404 });
  }
  const enrollment = store.enrollments.find((e) => e.userId === user.id && e.trackSlug === trackSlug);
  if (!enrollment) return NextResponse.json({ error: "Not enrolled." }, { status: 400 });

  if (!enrollment.completedModuleIds.includes(moduleId)) {
    enrollment.completedModuleIds.push(moduleId);
  }
  const done = enrollment.completedModuleIds.length === track.modules.length;
  let newCertificate = null;
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
    store.certificates.push(newCertificate);
  }
  return NextResponse.json({ enrollment, done, certificate: newCertificate });
}
