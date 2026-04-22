export function SparkChart({
  values,
  color = "var(--g)",
  height = 120,
  label,
}: {
  values: number[];
  color?: string;
  height?: number;
  label?: string;
}) {
  if (values.length === 0) return null;
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = Math.max(max - min, 1);
  const w = 600;
  const h = height;
  const step = values.length > 1 ? w / (values.length - 1) : w;
  const pts = values.map((v, i) => {
    const x = i * step;
    const y = h - ((v - min) / range) * (h - 12) - 6;
    return [x, y] as const;
  });
  const pathD = pts
    .map(([x, y], i) => (i === 0 ? `M${x},${y}` : `L${x},${y}`))
    .join(" ");
  const areaD = `${pathD} L${w},${h} L0,${h} Z`;
  const last = pts[pts.length - 1];

  return (
    <div className="card p-5">
      {label && (
        <div className="text-[11px] font-bold uppercase tracking-[0.1em] text-t3 mb-2">
          {label}
        </div>
      )}
      <svg
        viewBox={`0 0 ${w} ${h}`}
        preserveAspectRatio="none"
        className="w-full block"
        style={{ height }}
        role="img"
        aria-label={label}
      >
        <defs>
          <linearGradient id="spark-grad" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.35" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaD} fill="url(#spark-grad)" />
        <path d={pathD} fill="none" stroke={color} strokeWidth={2.2} strokeLinejoin="round" strokeLinecap="round" />
        <circle cx={last[0]} cy={last[1]} r={4} fill={color} />
        <circle cx={last[0]} cy={last[1]} r={8} fill={color} opacity="0.25" />
      </svg>
    </div>
  );
}
