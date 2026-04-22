import Link from "next/link";

type Cat = { id: string; label: string; emoji: string };

/**
 * Horizontal-scrolling category pill row for the feed. Server-rendered:
 * each pill is a real link, not a JS toggle, so filters survive reloads.
 */
export function FeedCategoryPills({
  current,
  categories,
}: {
  current: string;
  categories: Cat[];
}) {
  const pills: Cat[] = [{ id: "all", label: "All lessons", emoji: "◇" }, ...categories];
  return (
    <div className="flex flex-nowrap md:flex-wrap gap-2 overflow-x-auto no-scrollbar -mx-1 px-1 mb-4">
      {pills.map((p) => {
        const active = current === p.id;
        return (
          <Link
            key={p.id}
            href={p.id === "all" ? "/feed" : `/feed?cat=${p.id}`}
            className="shrink-0 px-3.5 py-2 rounded-full text-[13px] font-semibold transition-colors"
            style={{
              background: active ? "var(--g)" : "var(--surface-2)",
              color: active ? "var(--bg)" : "var(--text-1)",
              border: `1px solid ${active ? "var(--g)" : "var(--border-1)"}`,
            }}
          >
            <span className="mr-1.5">{p.emoji}</span>
            {p.label}
          </Link>
        );
      })}
    </div>
  );
}
