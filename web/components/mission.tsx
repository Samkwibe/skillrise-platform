import { missionPoints } from "@/lib/data";

export function Mission() {
  return (
    <section id="mission" className="section-pad">
      <div className="mx-wrap">
        <div className="grid gap-12 items-center" style={{ gridTemplateColumns: "1fr 1fr" }}>
          <div className="flex flex-col gap-5 mission-col">
            <div>
              <div className="stag">Our mission</div>
              <h2 className="sh">
                We believe people deserve better than an algorithm designed to waste their time.
              </h2>
            </div>
            {missionPoints.map((p) => (
              <div key={p.title} className="flex gap-4 items-start">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0"
                  style={{ background: "rgba(31,200,126,0.1)", border: "1px solid rgba(31,200,126,0.2)" }}
                >
                  {p.icon}
                </div>
                <div>
                  <h4 className="font-display font-bold mb-[6px] text-[17px]">{p.title}</h4>
                  <p className="text-t3 leading-[1.6] text-[14px]">{p.body}</p>
                </div>
              </div>
            ))}
          </div>

          <div
            className="relative overflow-hidden mission-col"
            style={{ background: "#121820", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 20, padding: 28 }}
          >
            <div className="font-display font-bold uppercase text-t3 mb-[14px]" style={{ fontSize: 12, letterSpacing: "0.08em" }}>
              Before & After SkillRise
            </div>

            <div
              style={{
                background: "linear-gradient(135deg,#1a0808,#2d0e0e)",
                border: "1px solid rgba(232,67,67,0.15)",
                borderRadius: 12,
                padding: 16,
                marginBottom: 12,
              }}
            >
              <div className="text-red font-bold uppercase mb-2" style={{ fontSize: 11, letterSpacing: "0.07em" }}>
                Before — typical evening
              </div>
              <div className="flex flex-col gap-[7px]">
                <BAItem icon="📱" text="45 min — TikTok / Instagram" color="#465070" />
                <BAItem icon="📺" text="90 min — streaming, half-asleep" color="#465070" />
                <BAItem icon="💭" text="Felt restless, like nothing got done" color="#465070" />
              </div>
            </div>

            <div
              style={{
                background: "linear-gradient(135deg,#071a10,#0e3524)",
                border: "1px solid rgba(31,200,126,0.15)",
                borderRadius: 12,
                padding: 16,
              }}
            >
              <div className="text-g font-bold uppercase mb-2" style={{ fontSize: 11, letterSpacing: "0.07em" }}>
                After — SkillRise evening
              </div>
              <div className="flex flex-col gap-[7px]">
                <BAItem icon="⚡" text="30 min — Electrical module 6" color="#edf2ff" />
                <BAItem icon="📺" text="20 min — Live session w/ John" color="#edf2ff" />
                <BAItem icon="✓" text="Certificate unlocked. 4 job matches." color="#1fc87e" />
              </div>
            </div>

            <div
              style={{
                marginTop: 14,
                background: "rgba(31,200,126,0.06)",
                border: "1px solid rgba(31,200,126,0.12)",
                borderRadius: 10,
                padding: "13px 16px",
              }}
            >
              <div className="text-t2 leading-[1.6] text-[13px]">
                "I deleted TikTok and replaced it with SkillRise. Six weeks later I had a
                job offer. The irony is, I'm happier now." — Marcus J., graduate
              </div>
            </div>
          </div>
        </div>
      </div>
      <style>{`@media(max-width:768px){#mission .grid{grid-template-columns:1fr !important;}}`}</style>
    </section>
  );
}

function BAItem({ icon, text, color }: { icon: string; text: string; color: string }) {
  return (
    <div className="flex items-center gap-[9px] text-[13px]" style={{ color }}>
      <span className="text-base">{icon}</span>
      {text}
    </div>
  );
}
