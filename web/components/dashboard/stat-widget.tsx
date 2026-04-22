type Trend = { delta: number; suffix?: string };

export function StatWidget({
  label,
  value,
  trend,
  icon,
  accent = "var(--g)",
}: {
  label: string;
  value: number | string;
  trend?: Trend;
  icon?: string;
  accent?: string;
}) {
  const up = trend ? trend.delta >= 0 : null;
  return (
    <div className="card p-5 relative overflow-hidden">
      <div
        aria-hidden
        className="absolute -top-8 -right-8 w-20 h-20 rounded-full blur-xl opacity-40"
        style={{ background: accent }}
      />
      <div className="flex items-start justify-between mb-2">
        <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-t3">
          {label}
        </span>
        {icon && (
          <span
            className="w-8 h-8 rounded-[8px] flex items-center justify-center text-[16px]"
            style={{
              background: `color-mix(in srgb, ${accent} 14%, transparent)`,
              color: accent,
            }}
          >
            {icon}
          </span>
        )}
      </div>
      <div className="font-display text-[32px] font-extrabold leading-none mb-2">
        {value}
      </div>
      {trend && (
        <div
          className={`text-[12px] font-semibold inline-flex items-center gap-1 ${
            up ? "text-g" : "text-red"
          }`}
        >
          <span>{up ? "▲" : "▼"}</span>
          <span>
            {Math.abs(trend.delta)}
            {trend.suffix ?? "%"} vs last week
          </span>
        </div>
      )}
    </div>
  );
}
