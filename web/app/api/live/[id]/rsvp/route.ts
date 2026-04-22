import { NextResponse } from "next/server";
import { store } from "@/lib/store";
import { getVerifiedUserForApi } from "@/lib/auth";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getVerifiedUserForApi();
  if (user instanceof NextResponse) return user;
  const { id } = await params;
  const { join } = await req.json();
  const session = store.liveSessions.find((s) => s.id === id);
  if (!session) return NextResponse.json({ error: "Not found." }, { status: 404 });
  session.attendees = session.attendees.filter((a) => a !== user.id);
  if (join) session.attendees.push(user.id);
  return NextResponse.json({ attendees: session.attendees.length });
}
