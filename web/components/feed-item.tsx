"use client";
import { useState } from "react";
import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";

type Comment = { id: string; userId: string; text: string; at: number };
type Post = {
  id: string;
  title: string;
  description: string;
  emoji: string;
  duration: string;
  likes: number;
  comments: Comment[];
  youth: boolean;
  trackSlug?: string;
  category?: string;
  takeaway?: string;
};
type Author = { id: string; name: string; role: string; avatar: string; credentials?: string };
type Category = { id: string; label: string; emoji: string } | null;

export function FeedItem({
  post,
  author,
  category,
  canSave = false,
  initialSaved = false,
}: {
  post: Post;
  author: Author;
  category?: Category;
  /** When true (learners + teens), renders the Save button. */
  canSave?: boolean;
  initialSaved?: boolean;
}) {
  const [likes, setLikes] = useState(post.likes);
  const [liked, setLiked] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState(post.comments);
  const [showComments, setShowComments] = useState(false);
  const [saved, setSaved] = useState(initialSaved);
  const [savingHint, setSavingHint] = useState<string | null>(null);

  async function toggleSave() {
    const will = !saved;
    setSaved(will);
    setSavingHint(will ? "Saved to your profile." : "Removed from your saved lessons.");
    try {
      const res = await fetch(`/api/feed/${post.id}/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ saved: will }),
      });
      if (!res.ok) {
        setSaved(!will);
        setSavingHint("Couldn't save right now. Try again?");
      }
    } catch {
      setSaved(!will);
      setSavingHint("Network hiccup. Try again?");
    }
    // Clear the hint after a beat so it doesn't linger forever.
    window.setTimeout(() => setSavingHint(null), 2200);
  }

  return (
    <article className="card overflow-hidden">
      <div className="flex items-center gap-3 p-4">
        <Avatar spec={author.avatar} size={40} />
        <div className="flex-1 min-w-0">
          <div className="text-[14px] font-semibold truncate">{author.name}</div>
          <div className="text-[11px] text-t3 capitalize">{author.role}{author.credentials ? ` · ${author.credentials}` : ""}</div>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap justify-end">
          {category && (
            <span className="pill" title={category.label}>
              {category.emoji} {category.label}
            </span>
          )}
          {post.youth && <span className="pill pill-purple">★ Youth</span>}
        </div>
      </div>
      <div className="aspect-[4/5] sm:aspect-video relative bg-gradient-to-br from-[#0d2a1c] to-[#1a1040] flex items-center justify-center">
        <div className="text-[64px]">{post.emoji}</div>
        <div className="absolute bottom-3 left-3 pill">▶ {post.duration}</div>
      </div>
      <div className="p-4">
        <div className="font-display text-[16px] font-bold mb-1">{post.title}</div>
        <p className="text-t2 text-[13.5px] mb-3">{post.description}</p>
        {post.takeaway && (
          <div
            className="mb-3 px-3 py-2 rounded-[10px] text-[12.5px] flex gap-2 items-start"
            style={{
              background: "color-mix(in srgb, var(--g) 10%, transparent)",
              border: "1px solid color-mix(in srgb, var(--g) 30%, transparent)",
              color: "var(--text-1)",
            }}
          >
            <span className="font-bold" style={{ color: "var(--g)" }}>◆ Takeaway</span>
            <span style={{ color: "var(--text-2)" }}>{post.takeaway}</span>
          </div>
        )}
        <div className="flex items-center gap-2 sm:gap-3 text-[13px] flex-wrap">
          <button
            type="button"
            onClick={async () => {
              const will = !liked;
              setLiked(will);
              setLikes((n) => n + (will ? 1 : -1));
              await fetch(`/api/feed/${post.id}/like`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ liked: will }) });
            }}
            className={`pill ${liked ? "pill-g" : ""}`}
          >
            ♥ {likes.toLocaleString()}
          </button>
          <button type="button" onClick={() => setShowComments((s) => !s)} className="pill">
            💬 {comments.length}
          </button>
          {canSave && (
            <button
              type="button"
              onClick={toggleSave}
              aria-pressed={saved}
              title={saved ? "Saved — tap to unsave" : "Save for later"}
              className="pill"
              style={
                saved
                  ? {
                      background: "color-mix(in srgb, var(--g) 18%, var(--surface-2))",
                      borderColor: "color-mix(in srgb, var(--g) 55%, var(--border-1))",
                      color: "var(--g)",
                      fontWeight: 700,
                    }
                  : undefined
              }
            >
              {saved ? "✓ Saved" : "⊕ Save"}
            </button>
          )}
          {post.trackSlug && (
            <Link href={`/tracks/${post.trackSlug}`} className="pill pill-g">See full track →</Link>
          )}
          {savingHint && (
            <span
              className="text-[11.5px] ml-auto"
              style={{ color: saved ? "var(--g)" : "var(--text-3)" }}
              role="status"
            >
              {savingHint}
            </span>
          )}
        </div>
        {showComments && (
          <div className="mt-4 border-t border-border1 pt-4">
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!commentText.trim()) return;
                const res = await fetch(`/api/feed/${post.id}/comment`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ text: commentText }),
                });
                const body = await res.json();
                if (res.ok) {
                  setComments((c) => [...c, body.comment]);
                  setCommentText("");
                }
              }}
              className="flex gap-2 mb-3"
            >
              <input className="input" placeholder="Add a thoughtful comment…" value={commentText} onChange={(e) => setCommentText(e.target.value)} />
              <button className="btn btn-primary btn-sm" type="submit">Send</button>
            </form>
            <div className="flex flex-col gap-2">
              {comments.map((c) => (
                <div key={c.id} className="text-[13px] text-t2">
                  <span className="font-semibold text-t1">You</span> — {c.text}
                </div>
              ))}
              {comments.length === 0 && <div className="text-[12px] text-t3">Be the first to comment.</div>}
            </div>
          </div>
        )}
      </div>
    </article>
  );
}
