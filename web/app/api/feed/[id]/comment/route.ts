import { NextResponse } from "next/server";
import { store, id as newId, findUserById } from "@/lib/store";
import { getVerifiedUserForApi } from "@/lib/auth";
import { persistFeedPost } from "@/lib/feed/persist-feed-post";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getVerifiedUserForApi();
  if (user instanceof NextResponse) return user;
  const { id } = await params;
  const { text } = await req.json();
  if (!text?.trim()) return NextResponse.json({ error: "Comment cannot be empty." }, { status: 400 });
  const post = store.feed.find((f) => f.id === id);
  if (!post) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const comment = { id: `c_${newId()}`, userId: user.id, text: String(text).slice(0, 500), at: Date.now() };
  post.comments.push(comment);
  await persistFeedPost(post);
  const author = findUserById(user.id);
  return NextResponse.json(
    { comment, authorName: author?.name?.split(" ")[0] ?? "Member" },
    { status: 201 },
  );
}
