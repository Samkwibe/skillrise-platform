import Link from "next/link";
import { FeedItem } from "@/components/feed-item";

type Author = {
  id: string;
  name: string;
  role: string;
  avatar: string;
  credentials?: string;
} | null;

type Category = { id: string; label: string; emoji: string } | null;

type PostShape = {
  id: string;
  title: string;
  description: string;
  emoji: string;
  duration: string;
  likes: number;
  comments: { id: string; userId: string; text: string; at: number }[];
  youth: boolean;
  trackSlug?: string;
  category?: string;
  takeaway?: string;
  createdAt: number;
};

type Item = { post: PostShape; author: Author; category: Category };

/**
 * "Saved lessons" panel — every post the user tapped Save on, grouped
 * by life-skill category so it feels like a collection, not a feed.
 * Empty state is intentionally gentle: no judgment, just a nudge.
 */
export function SavedLessons({ items }: { items: Item[] }) {
  if (items.length === 0) {
    return (
      <div
        className="cover-card p-6 md:p-8 text-center flex flex-col items-center gap-3"
        style={{ background: "var(--surface-1)" }}
      >
        <div className="text-[42px]">🔖</div>
        <div
          className="font-extrabold text-[18px]"
          style={{ fontFamily: "var(--role-font-display)" }}
        >
          No saved lessons yet.
        </div>
        <p className="text-[13.5px] max-w-[420px]" style={{ color: "var(--text-2)" }}>
          Tap <span className="font-bold">⊕ Save</span> on anything in the feed that looks useful —
          it'll show up here, waiting when you are.
        </p>
        <Link
          href="/feed"
          className="inline-flex items-center rounded-full px-4 py-2 text-[13px] font-bold"
          style={{ background: "var(--g)", color: "var(--bg)" }}
        >
          Open the feed →
        </Link>
      </div>
    );
  }

  // Bucket by category so the profile looks like a tidy notebook, not
  // a recency timeline. Keeps items in saved-order within each bucket.
  const buckets = new Map<string, { label: string; emoji: string; items: Item[] }>();
  for (const it of items) {
    const key = it.category?.id ?? "general";
    if (!buckets.has(key)) {
      buckets.set(key, {
        label: it.category?.label ?? "General",
        emoji: it.category?.emoji ?? "◇",
        items: [],
      });
    }
    buckets.get(key)!.items.push(it);
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-baseline gap-3">
        <h2
          className="font-extrabold text-[22px] md:text-[24px]"
          style={{ fontFamily: "var(--role-font-display)", letterSpacing: "-0.01em" }}
        >
          Your saved lessons
        </h2>
        <div className="text-[13px]" style={{ color: "var(--text-3)" }}>
          {items.length} saved · grouped by life skill
        </div>
      </div>

      {[...buckets.entries()].map(([key, bucket]) => (
        <section key={key}>
          <div
            className="flex items-center gap-2 mb-3 text-[12px] font-bold uppercase tracking-[0.14em]"
            style={{ color: "var(--text-3)" }}
          >
            <span className="text-[16px]">{bucket.emoji}</span>
            <span>{bucket.label}</span>
            <span style={{ color: "var(--text-3)" }}>· {bucket.items.length}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 3xl:grid-cols-3 gap-4">
            {bucket.items.map((it) =>
              it.author ? (
                <FeedItem
                  key={it.post.id}
                  post={it.post}
                  author={it.author}
                  category={it.category}
                  canSave
                  initialSaved
                />
              ) : null,
            )}
          </div>
        </section>
      ))}
    </div>
  );
}
