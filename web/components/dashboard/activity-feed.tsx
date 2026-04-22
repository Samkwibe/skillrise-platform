export type ActivityItem = {
  id: string;
  icon: string;
  title: string;
  body?: string;
  at: number;
  accent?: string;
};

function timeAgo(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export function ActivityFeed({
  items,
  title = "Recent activity",
}: {
  items: ActivityItem[];
  title?: string;
}) {
  return (
    <div className="card p-5">
      <div className="text-[11px] font-bold uppercase tracking-[0.1em] text-t3 mb-3">
        {title}
      </div>
      {items.length === 0 ? (
        <div className="text-t3 text-[13px]">Nothing yet — start a lesson and come back.</div>
      ) : (
        <ul className="space-y-3">
          {items.map((i) => (
            <li key={i.id} className="flex gap-3 items-start">
              <div
                className="w-9 h-9 rounded-[9px] flex items-center justify-center text-[16px] flex-shrink-0"
                style={{
                  background: `color-mix(in srgb, ${i.accent || "var(--g)"} 14%, transparent)`,
                  color: i.accent || "var(--g)",
                }}
              >
                {i.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-semibold text-t1 truncate">{i.title}</div>
                {i.body && <div className="text-[12px] text-t3 truncate">{i.body}</div>}
              </div>
              <div className="text-[11px] text-t3 flex-shrink-0">{timeAgo(i.at)}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
