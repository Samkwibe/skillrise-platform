import { NextResponse } from "next/server";
import { store, id } from "@/lib/store";
import { getVerifiedUserForApi } from "@/lib/auth";

export async function GET() {
  return NextResponse.json({ sessions: store.liveSessions });
}

export async function POST(req: Request) {
  const user = await getVerifiedUserForApi();
  if (user instanceof NextResponse) return user;
  if (user.role !== "teacher" && user.role !== "admin") {
    return NextResponse.json({ error: "Only teachers can schedule live sessions." }, { status: 403 });
  }
  const { title, topic, startsAt, durationMin, youth } = await req.json();
  if (!title || !topic || !startsAt) {
    return NextResponse.json({ error: "Title, topic, and start time required." }, { status: 400 });
  }
  const session = {
    id: `l_${id()}`,
    teacherId: user.id,
    title,
    topic,
    startsAt: new Date(startsAt).getTime(),
    durationMin: Number(durationMin) || 45,
    attendees: [] as string[],
    status: "scheduled" as const,
    youth: Boolean(youth),
  };
  store.liveSessions.push(session);
  return NextResponse.json({ session }, { status: 201 });
}
