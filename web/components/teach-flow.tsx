import { teachSteps } from "@/lib/data";

export function TeachFlow() {
  return (
    <section id="teach" className="section-pad">
      <div className="mx-wrap">
        <div className="text-center">
          <div className="stag">For volunteer teachers</div>
          <h2 className="sh">
            You have skills someone needs.
            <br />
            30 minutes of your time. A lifetime of their impact.
          </h2>
          <p className="ss mx-auto">
            SkillRise makes it as easy as possible to share what you know. No equipment
            required. No experience teaching required. Just show up and be real.
          </p>
        </div>

        <div className="relative mt-11">
          <div
            className="absolute hidden md:block"
            aria-hidden
            style={{
              top: 24,
              left: "12%",
              right: "12%",
              height: 1,
              background:
                "linear-gradient(90deg,transparent,rgba(255,255,255,0.13),rgba(255,255,255,0.13),transparent)",
            }}
          />
          <div
            className="grid relative z-[1]"
            style={{ gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))" }}
          >
            {teachSteps.map((s) => (
              <div key={s.title} className="text-center" style={{ padding: "0 16px" }}>
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-base"
                  style={{
                    background: `rgba(${s.color},0.1)`,
                    border: `1px solid rgba(${s.color},0.2)`,
                  }}
                >
                  {s.icon}
                </div>
                <h3 className="font-display font-bold text-[16px] mb-2">{s.title}</h3>
                <p className="text-t3 text-[13px] leading-[1.6]">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="flex justify-center mt-9">
          <a href="#download" className="btn btn-primary btn-xl">
            Start teaching for free →
          </a>
        </div>
      </div>
    </section>
  );
}
