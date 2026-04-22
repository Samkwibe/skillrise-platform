import { impactStats } from "@/lib/data";

export function ImpactStrip() {
  return (
    <div
      className="bg-s1 border-t border-b border-[rgba(255,255,255,0.07)]"
      style={{ padding: "clamp(28px,4vw,48px) clamp(18px,5vw,72px)" }}
    >
      <div className="mx-wrap">
        <div className="flex flex-wrap">
          {impactStats.map((s, i) => (
            <div
              key={s.label}
              className="flex-1 text-center"
              style={{
                minWidth: 140,
                padding: "clamp(16px,2.5vw,28px) 20px",
                borderRight: i < impactStats.length - 1 ? "1px solid rgba(255,255,255,0.07)" : "none",
              }}
            >
              <div
                className="font-display font-extrabold"
                style={{ fontSize: "clamp(24px,3.5vw,36px)", color: s.color }}
              >
                {s.value}
              </div>
              <div className="text-t3 text-[13px] mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
