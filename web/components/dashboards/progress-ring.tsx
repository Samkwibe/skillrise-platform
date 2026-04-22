/** Circular SVG progress ring — the learner dashboard's signature widget. */
export function ProgressRing({
  value,
  size = 88,
  stroke = 8,
  color = "var(--g)",
  label,
  sublabel,
}: {
  value: number;
  size?: number;
  stroke?: number;
  color?: string;
  label?: string;
  sublabel?: string;
}) {
  const clamped = Math.min(100, Math.max(0, value));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (clamped / 100) * c;

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="var(--border-1)"
          strokeWidth={stroke}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center leading-tight">
        <div className="font-extrabold" style={{ fontSize: size * 0.28, color: "var(--text-1)" }}>
          {label ?? `${Math.round(clamped)}%`}
        </div>
        {sublabel && (
          <div className="text-[10px] uppercase tracking-wider" style={{ color: "var(--text-3)" }}>
            {sublabel}
          </div>
        )}
      </div>
    </div>
  );
}
