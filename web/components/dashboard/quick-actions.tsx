import Link from "next/link";

export type QuickAction = {
  href: string;
  label: string;
  sub: string;
  icon: string;
  accent: string;
};

export function QuickActions({ items }: { items: QuickAction[] }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {items.map((a) => (
        <Link
          key={a.href + a.label}
          href={a.href}
          className="card card-hover p-4 flex gap-3 items-center group"
        >
          <div
            className="w-10 h-10 rounded-[10px] flex items-center justify-center text-[20px] flex-shrink-0 transition-transform group-hover:scale-110"
            style={{
              background: `color-mix(in srgb, ${a.accent} 14%, transparent)`,
              color: a.accent,
            }}
          >
            {a.icon}
          </div>
          <div className="min-w-0">
            <div className="text-[13px] font-bold text-t1 truncate">{a.label}</div>
            <div className="text-[11px] text-t3 truncate">{a.sub}</div>
          </div>
        </Link>
      ))}
    </div>
  );
}
