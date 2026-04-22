import { audiences } from "@/lib/data";

export function Audiences() {
  return (
    <section className="section-pad border-t border-[rgba(255,255,255,0.07)] bg-s1">
      <div className="mx-wrap">
        <div className="text-center">
          <div className="stag">Who SkillRise is for</div>
          <h2 className="sh">
            Whether you need to learn,
            <br />
            teach, or start young — you belong here.
          </h2>
        </div>
        <div
          className="grid gap-4 mt-10"
          style={{ gridTemplateColumns: "repeat(auto-fit,minmax(290px,1fr))" }}
        >
          {audiences.map((a) => (
            <div
              key={a.title}
              className="relative overflow-hidden border transition-transform hover:-translate-y-[3px]"
              style={{ background: a.gradient, borderColor: a.border, borderRadius: 20, padding: 28 }}
            >
              <div className="text-[36px] mb-4">{a.icon}</div>
              <h3 className="font-display font-bold text-[20px] mb-2 text-white">{a.title}</h3>
              <p className="text-[14px] opacity-60 mb-[18px]" style={{ color: "rgba(255,255,255,0.5)" }}>
                {a.subtitle}
              </p>
              <div className="flex flex-col gap-[10px] mb-[22px]">
                {a.bullets.map((b) => (
                  <div key={b} className="flex items-start gap-[9px] text-[14px]">
                    <div className="text-[12px] font-bold mt-[2px] flex-shrink-0" style={{ color: a.accent }}>
                      ✓
                    </div>
                    <div>{b}</div>
                  </div>
                ))}
              </div>
              <a
                href={
                  a.variant === "teacher"
                    ? "/signup?role=teacher"
                    : a.variant === "youth"
                      ? "/signup?role=teen"
                      : "/signup"
                }
              >
                <button
                  className="btn"
                  style={{
                    background: a.accent,
                    color: a.textAccent,
                    fontSize: 13,
                    fontWeight: 700,
                    padding: "10px 20px",
                    borderRadius: 9,
                  }}
                >
                  {a.cta}
                </button>
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
