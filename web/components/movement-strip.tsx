import { movementStats } from "@/lib/data";

export function MovementStrip() {
  return (
    <div
      className="border-t border-b border-[rgba(255,255,255,0.07)] bg-s1"
      style={{ padding: "clamp(32px,4vw,52px) clamp(18px,5vw,72px)" }}
    >
      <div className="mx-wrap">
        <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))" }}>
          {movementStats.map((s, i) => (
            <div
              key={s.label}
              className="text-center"
              style={{
                padding: "clamp(20px,3vw,36px) 24px",
                borderRight:
                  i < movementStats.length - 1 ? "1px solid rgba(255,255,255,0.07)" : "none",
              }}
            >
              <div
                className="font-display font-extrabold text-g"
                style={{ fontSize: "clamp(26px,4vw,38px)" }}
              >
                {s.value}
              </div>
              <div className="text-t3 mt-1 text-[14px]">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
