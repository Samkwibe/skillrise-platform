import { NextResponse } from "next/server";
import { store, userEnrollments, id, getTrack } from "@/lib/store";
import { getVerifiedUserForApi } from "@/lib/auth";

export async function GET() {
  const user = await getVerifiedUserForApi();
  if (user instanceof NextResponse) return user;
  return NextResponse.json({ enrollments: userEnrollments(user.id) });
}

export async function POST(req: Request) {
  const user = await getVerifiedUserForApi();
  if (user instanceof NextResponse) return user;
  const { trackSlug } = await req.json();
  if (!getTrack(trackSlug)) return NextResponse.json({ error: "Unknown track." }, { status: 404 });
  const existing = store.enrollments.find((e) => e.userId === user.id && e.trackSlug === trackSlug);
  if (existing) return NextResponse.json({ enrollment: existing });
  const enrollment = {
    id: `e_${id()}`,
    userId: user.id,
    trackSlug,
    startedAt: Date.now(),
    completedModuleIds: [] as string[],
  };
  store.enrollments.push(enrollment);
  return NextResponse.json({ enrollment }, { status: 201 });
}
