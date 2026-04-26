/** Circular SVG progress ring — updated for premium glassmorphism. */
export function ProgressRing({
  value,
  size = 88,
  stroke = 8,
  color = "#10b981", // default emerald-500
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
      className="relative inline-flex items-center justify-center group"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }} className="drop-shadow-lg">
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          className="stroke-white/10"
          strokeWidth={stroke}
          fill="none"
        />
        {/* Progress */}
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
          style={{ transition: "stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1)" }}
          className="drop-shadow-[0_0_8px_rgba(var(--tw-shadow-color),0.5)]"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center leading-tight">
        <div className="font-extrabold text-white group-hover:scale-105 transition-transform" style={{ fontSize: size * 0.28 }}>
          {label ?? `${Math.round(clamped)}%`}
        </div>
        {sublabel && (
          <div className="text-[10px] uppercase tracking-wider text-white/50 mt-0.5">
            {sublabel}
          </div>
        )}
      </div>
    </div>
  );
}
