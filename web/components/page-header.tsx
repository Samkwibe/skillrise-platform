export function PageHeader({
  eyebrow,
  title,
  subtitle,
  right,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
      <div>
        {eyebrow && <div className="stag">{eyebrow}</div>}
        <h1 className="font-display text-[clamp(24px,3vw,36px)] font-extrabold leading-tight tracking-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="text-t2 mt-1 max-w-[640px] text-base leading-relaxed">{subtitle}</p>
        )}
      </div>
      {right && <div className="flex gap-2">{right}</div>}
    </div>
  );
}
