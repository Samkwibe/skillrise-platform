import { NextResponse } from "next/server";
import { store, id, findUserById } from "@/lib/store";
import { getVerifiedUserForApi } from "@/lib/auth";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getVerifiedUserForApi();
  if (user instanceof NextResponse) return user;
  const { id: cohortId } = await params;
  const cohort = store.cohorts.find((c) => c.id === cohortId);
  if (!cohort) return NextResponse.json({ error: "Cohort not found." }, { status: 404 });
  const isTeacher = store.tracks.find((t) => t.slug === cohort.trackSlug)?.teacherId === user.id;
  if (!cohort.members.includes(user.id) && !isTeacher && user.role !== "admin") {
    return NextResponse.json({ error: "Not a member." }, { status: 403 });
  }
  const { text } = await req.json();
  if (!text?.trim()) return NextResponse.json({ error: "Message cannot be empty." }, { status: 400 });
  const message = { id: `cm_${id()}`, cohortId, userId: user.id, text: String(text).slice(0, 1000), at: Date.now() };
  store.cohortMessages.push(message);
  const author = findUserById(user.id);
  return NextResponse.json({
    message: {
      ...message,
      author: author ? { name: author.name, avatar: author.avatar } : null,
    },
  }, { status: 201 });
}
