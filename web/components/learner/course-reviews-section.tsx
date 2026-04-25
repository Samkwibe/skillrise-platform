"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/ui/avatar";

export type ReviewRow = {
  id: string;
  rating: number;
  body: string;
  helpfulCount: number;
  createdAt: number;
  instructorReply?: string;
  instructorRepliedAt?: number;
  author: { name: string; avatar: string };
  isOwnReview: boolean;
  helpfulVotedByMe: boolean;
};

export function CourseReviewsSection({
  trackSlug,
  canPost,
  hasAlreadyReviewed,
  initialReviews,
}: {
  trackSlug: string;
  canPost: boolean;
  hasAlreadyReviewed: boolean;
  initialReviews: ReviewRow[];
}) {
  const router = useRouter();
  const [reviews, setReviews] = useState(initialReviews);
  const [hasPosted, setHasPosted] = useState(hasAlreadyReviewed);
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState("");
  const [submitErr, setSubmitErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [voting, setVoting] = useState<string | null>(null);

  async function submitReview(e: React.FormEvent) {
    e.preventDefault();
    setSubmitErr(null);
    setBusy(true);
    try {
      const res = await fetch(`/api/tracks/${encodeURIComponent(trackSlug)}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, body: body.trim() }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        review?: {
          id: string;
          rating: number;
          body: string;
          helpfulCount: number;
          createdAt: number;
          author: { name: string; avatar: string } | null;
        };
      };
      if (!res.ok) {
        setSubmitErr(data.error ?? "Could not post review");
        return;
      }
      if (data.review) {
        const a = data.review.author;
        setReviews((prev) => [
          {
            id: data.review!.id,
            rating: data.review!.rating,
            body: data.review!.body,
            helpfulCount: data.review!.helpfulCount,
            createdAt: data.review!.createdAt,
            author: a ? { name: a.name, avatar: a.avatar } : { name: "Learner", avatar: "" },
            isOwnReview: true,
            helpfulVotedByMe: false,
          },
          ...prev,
        ]);
        setBody("");
        setHasPosted(true);
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  async function markHelpful(reviewId: string) {
    setVoting(reviewId);
    try {
      const res = await fetch(
        `/api/tracks/${encodeURIComponent(trackSlug)}/reviews/${encodeURIComponent(reviewId)}/helpful`,
        { method: "POST" },
      );
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; added?: boolean };
      if (!res.ok || !data.added) return;
      setReviews((prev) =>
        prev.map((r) =>
          r.id === reviewId
            ? { ...r, helpfulCount: r.helpfulCount + 1, helpfulVotedByMe: true }
            : r,
        ),
      );
    } finally {
      setVoting(null);
    }
  }

  const showForm = canPost && !hasPosted;

  return (
    <div className="mb-10">
      <h2 className="font-display text-[20px] font-bold mb-3">Learner reviews</h2>
      {showForm && (
        <form
          onSubmit={submitReview}
          className="card p-4 mb-4"
          style={{ border: "1px solid var(--border-1)" }}
        >
          <div className="text-[13px] font-semibold mb-2">Share your experience</div>
          <div className="flex gap-1 mb-3" role="group" aria-label="Star rating">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                className="text-[22px] leading-none p-0.5 rounded hover:opacity-90"
                style={{ color: n <= rating ? "var(--g)" : "var(--text-3)" }}
                aria-pressed={n <= rating}
                aria-label={`${n} stars`}
              >
                ★
              </button>
            ))}
            <span className="ml-2 text-[12px] text-t3 self-center">{rating} / 5</span>
          </div>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={4}
            minLength={10}
            maxLength={2000}
            className="w-full rounded-lg px-3 py-2 text-[14px] bg-[var(--surface-2)] border border-[var(--border-1)] text-[var(--text-1)] placeholder:text-t3"
            placeholder="What worked well? What could improve? (10–2000 characters)"
            required
          />
          {submitErr && <p className="text-[12px] text-rose-400 mt-2">{submitErr}</p>}
          <button
            type="submit"
            disabled={busy || body.trim().length < 10}
            className="btn btn-primary mt-3"
          >
            {busy ? "Posting…" : "Post review"}
          </button>
        </form>
      )}

      {!canPost && (
        <p className="text-[13px] text-t3 mb-4">Enroll in this course to leave a review.</p>
      )}
      {canPost && hasPosted && (
        <p className="text-[13px] text-t3 mb-4">Thanks — you have already submitted a review for this course.</p>
      )}

      <div className="flex flex-col gap-3">
        {reviews.length === 0 && <p className="text-[13px] text-t3">No reviews yet. Be the first to share feedback.</p>}
        {reviews.map((r) => (
          <div key={r.id} className="card p-4" style={{ border: "1px solid var(--border-1)" }}>
            <div className="flex items-start gap-3">
              <Avatar spec={r.author.avatar} size={40} />
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-[14px]">{r.author.name}</span>
                  <span className="text-amber-400 text-[13px]">
                    {(() => {
                      const n = Math.min(5, Math.max(1, Math.round(r.rating)));
                      return "★".repeat(n) + "☆".repeat(5 - n);
                    })()}
                  </span>
                </div>
                <p className="text-[12px] text-t3 mt-0.5">
                  {new Date(r.createdAt).toLocaleDateString(undefined, { dateStyle: "medium" })}
                </p>
                <p className="text-[14px] text-t2 mt-2 whitespace-pre-wrap">{r.body}</p>
                {r.instructorReply && (
                  <div
                    className="mt-3 rounded-lg p-3 text-[13px]"
                    style={{ background: "var(--surface-2)", borderLeft: "3px solid var(--g)" }}
                  >
                    <div className="text-[11px] uppercase font-bold text-t3 mb-1">Instructor</div>
                    {r.instructorReply}
                  </div>
                )}
                {!r.isOwnReview && (
                  <div className="mt-2">
                    <button
                      type="button"
                      disabled={r.helpfulVotedByMe || voting === r.id}
                      onClick={() => void markHelpful(r.id)}
                      className="text-[12px] font-semibold px-2 py-1 rounded-md hover:bg-[var(--surface-2)] disabled:opacity-50"
                    >
                      {r.helpfulVotedByMe ? "✓ Marked helpful" : "Helpful"}{" "}
                      {r.helpfulCount > 0 ? `· ${r.helpfulCount}` : ""}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
