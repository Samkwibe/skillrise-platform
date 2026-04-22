import { testimonials } from "@/lib/data";

export function Testimonials() {
  return (
    <section id="stories" className="section-pad bg-s1 border-t border-[rgba(255,255,255,0.07)]">
      <div className="mx-wrap">
        <div className="text-center">
          <div className="stag">Real stories</div>
          <h2 className="sh">People whose lives actually changed</h2>
          <p className="ss mx-auto">
            These aren't marketing stories. These are real people from real
            neighborhoods who replaced scrolling with learning and changed the course of
            their lives.
          </p>
        </div>
        <div
          className="grid gap-[14px] mt-10"
          style={{ gridTemplateColumns: "repeat(auto-fit,minmax(270px,1fr))" }}
        >
          {testimonials.map((t) => (
            <div
              key={t.quote.slice(0, 40)}
              className="bg-s1 border border-[rgba(255,255,255,0.07)]"
              style={{ borderRadius: 20, padding: 24 }}
            >
              <blockquote className="text-t2 italic text-[14px] leading-[1.7] mb-[18px]">
                <span
                  className="font-display text-g block leading-[1] mb-[6px]"
                  style={{ fontSize: 28 }}
                >
                  "
                </span>
                {t.quote}
              </blockquote>
              <div className="flex items-center gap-[11px]">
                <div
                  className="w-[38px] h-[38px] rounded-full flex items-center justify-center text-[13px] font-bold text-white"
                  style={{ background: t.avatarGradient }}
                >
                  {t.initials}
                </div>
                <div>
                  <div className="font-bold text-[14px]">{t.name}</div>
                  <div className="text-t3 text-[12px]">{t.role}</div>
                  {t.wage && (
                    <div className="text-[12px] font-bold text-g mt-[2px]">{t.wage}</div>
                  )}
                  {t.tag && (
                    <div
                      className="inline-block font-bold mt-[2px]"
                      style={{
                        fontSize: 10,
                        padding: "2px 7px",
                        borderRadius: 5,
                        background:
                          t.tag.color === "amber"
                            ? "rgba(245,166,35,0.1)"
                            : "rgba(155,108,245,0.1)",
                        color: t.tag.color === "amber" ? "#f5a623" : "#9b6cf5",
                      }}
                    >
                      {t.tag.label}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
