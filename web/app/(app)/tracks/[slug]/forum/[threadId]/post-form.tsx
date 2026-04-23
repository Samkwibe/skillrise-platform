"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ForumPostForm({ trackSlug, threadId }: { trackSlug: string; threadId: string }) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  return (
    <div className="space-y-2">
      <textarea
        className="w-full min-h-[100px] rounded-lg bg-[rgba(0,0,0,0.2)] border border-white/10 p-3 text-sm"
        placeholder="Write a reply…"
        value={body}
        onChange={(e) => setBody(e.target.value)}
      />
      {err && <div className="text-rose-300 text-sm">{err}</div>}
      <button
        type="button"
        className="btn btn-primary"
        disabled={busy || !body.trim()}
        onClick={async () => {
          setBusy(true);
          setErr("");
          const res = await fetch(
            `/api/course/${encodeURIComponent(trackSlug)}/forums/threads/${encodeURIComponent(threadId)}/posts`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ body: body.trim() }),
            },
          );
          setBusy(false);
          if (!res.ok) {
            const b = await res.json().catch(() => ({}));
            setErr(b.error || "Could not post");
            return;
          }
          setBody("");
          router.refresh();
        }}
      >
        Post
      </button>
    </div>
  );
}

export function LikeButton({ trackSlug, threadId, postId, liked, count }: { trackSlug: string; threadId: string; postId: string; liked: boolean; count: number }) {
  const [state, setState] = useState({ liked, count });
  return (
    <button
      type="button"
      className="text-[11px] text-t3 hover:text-g"
      onClick={async () => {
        const res = await fetch(
          `/api/course/${encodeURIComponent(trackSlug)}/forums/threads/${encodeURIComponent(threadId)}/posts/${encodeURIComponent(postId)}/like`,
          { method: "POST" },
        );
        if (res.ok) {
          const j = await res.json();
          setState({ liked: j.liked, count: (j.post?.likedBy?.length as number) ?? state.count });
        }
      }}
    >
      {state.liked ? "♥" : "♡"} {state.count}
    </button>
  );
}
