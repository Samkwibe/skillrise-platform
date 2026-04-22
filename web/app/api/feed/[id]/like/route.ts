import { NextResponse } from "next/server";
import { store } from "@/lib/store";
import { getVerifiedUserForApi } from "@/lib/auth";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getVerifiedUserForApi();
  if (user instanceof NextResponse) return user;
  const { id } = await params;
  const { liked } = await req.json();
  const post = store.feed.find((f) => f.id === id);
  if (!post) return NextResponse.json({ error: "Not found." }, { status: 404 });
  post.likes += liked ? 1 : -1;
  if (post.likes < 0) post.likes = 0;
  return NextResponse.json({ likes: post.likes });
}
