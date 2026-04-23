import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireVerifiedUser } from "@/lib/auth";
import { getTrack } from "@/lib/store";
import { getDb } from "@/lib/db";
import { ensureTracksFromDatabase } from "@/lib/course/ensure-tracks";
import { ForumPostForm, LikeButton } from "./post-form";

export const dynamic = "force-dynamic";

export default async function CourseForumThreadPage({
  params,
}: {
  params: Promise<{ slug: string; threadId: string }>;
}) {
  const { slug, threadId } = await params;
  const user = await requireVerifiedUser();
  await ensureTracksFromDatabase();
  const track = getTrack(slug);
  if (!track) return notFound();
  const db = getDb();
  await db.ready();
  const e = await db.getEnrollment(user.id, slug);
  if (!e) redirect(`/tracks/${slug}`);
  if (e.pendingApproval) redirect(`/tracks/${slug}?pending=1`);
  const t = await db.getForumThread(threadId);
  if (!t || t.deletedAt || t.trackSlug !== slug) return notFound();
  const posts = await db.listForumPostsByThread(threadId);
  const mustPost = t.requirePostFirst && user.id !== track.teacherId;
  const hasMine = posts.some((p) => p.userId === user.id);
  const visible =
    !mustPost || hasMine || user.id === track.teacherId
      ? posts
      : posts.filter((p) => p.userId === user.id);

  return (
    <div className="section-pad-x py-10 max-w-3xl">
      <Link href={`/tracks/${slug}/forum`} className="text-[13px] text-t3 underline">
        ← Back to discussion
      </Link>
      <h1 className="font-display text-2xl font-extrabold mt-2 mb-1">{t.title}</h1>
      {t.closed && <p className="text-amber-200 text-sm mb-4">This topic is closed.</p>}
      {mustPost && !hasMine && user.id !== track.teacherId && (
        <p className="text-t2 text-sm mb-4">Start a post before reading others in this thread.</p>
      )}
      <ul className="space-y-3 mb-6">
        {visible.map((p) => (
          <li key={p.id} className="card p-3 text-sm text-t2 whitespace-pre-wrap">
            <div className="text-[11px] text-t3 mb-1">{p.userId === user.id ? "You" : "Participant"}</div>
            {p.body}
            <div className="mt-2">
              <LikeButton
                trackSlug={slug}
                threadId={threadId}
                postId={p.id}
                liked={p.likedBy.includes(user.id)}
                count={p.likedBy.length}
              />
            </div>
          </li>
        ))}
      </ul>
      {(!t.closed || user.id === track.teacherId) && <ForumPostForm trackSlug={slug} threadId={threadId} />}
    </div>
  );
}
