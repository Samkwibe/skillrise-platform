export function Hero() {
  return (
    <section
      className="relative overflow-hidden min-h-[92vh] flex items-center pt-[80px]"
      style={{ padding: "80px clamp(18px,5vw,72px) clamp(56px,7vw,108px)" }}
      suppressHydrationWarning
    >
      <div className="absolute inset-0 pointer-events-none" style={{ background: "var(--hero-radial)" }} aria-hidden suppressHydrationWarning />
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.5]"
        style={{
          backgroundImage:
            "linear-gradient(var(--grid-line) 1px, transparent 1px), linear-gradient(90deg, var(--grid-line) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage: "radial-gradient(ellipse 70% 60% at 50% 40%, black 40%, transparent 80%)",
          WebkitMaskImage: "radial-gradient(ellipse 70% 60% at 50% 40%, black 40%, transparent 80%)",
        }}
        aria-hidden
        suppressHydrationWarning
      />

      <div className="relative z-[1] flex items-center gap-12 dash-wrap w-full hero-stack">
        <div className="flex-1 min-w-0 hero-text animate-fade-in-up">
          <div className="stag">📵 The alternative to endless scrolling</div>
          <h1
            className="font-display font-extrabold mb-[22px]"
            style={{ fontSize: "clamp(34px,6vw,70px)", lineHeight: 1.05, letterSpacing: "-0.03em" }}
          >
            Stop{" "}
            <span className="relative text-t3">
              scrolling.
              <span aria-hidden className="absolute left-0 top-1/2 w-full h-[3px] bg-red" style={{ transform: "translateY(-50%)" }} />
            </span>
            <br />
            Start <span className="gradient-text">rising.</span>
          </h1>
          <p className="mb-[30px] max-w-[540px] text-t2" style={{ fontSize: "clamp(15px,1.8vw,19px)", lineHeight: 1.6 }}>
            SkillRise is a free platform where anyone can learn a practical skill, get
            certified, and get hired — and where people with knowledge teach others for
            free, simply to help their community rise.
          </p>
          <div className="flex gap-[11px] flex-wrap mb-9">
            <a href="/signup" className="btn btn-primary btn-xl">
              Start learning free →
            </a>
            <a href="/signup?role=teacher" className="btn btn-ghost btn-xl">
              Teach for free
            </a>
            <a href="#features" className="btn btn-ghost btn-xl">
              See what you get
            </a>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <TrustPill>📱 Free on iOS & Android</TrustPill>
            <TrustPill>🎓 <strong className="text-g">3,400+</strong> volunteer teachers</TrustPill>
            <TrustPill>★ <strong className="text-g">4.9</strong> / 12,000+ graduates</TrustPill>
          </div>
        </div>
        <div className="flex-shrink-0 animate-floaty hero-vis" style={{ width: "clamp(260px,36%,420px)" }}>
          <PhoneMockup />
        </div>
      </div>

      <style>{`
        @media(max-width:900px){
          .hero-stack{flex-direction:column;text-align:center;}
          .hero-vis{width:100%;max-width:300px;margin:0 auto;}
          .hero-text p, .hero-text div.flex{margin-left:auto;margin-right:auto;justify-content:center;}
        }
      `}</style>
    </section>
  );
}

function TrustPill({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[12px] text-t2 glass" style={{ padding: "6px 12px", borderRadius: 20 }}>
      {children}
    </div>
  );
}

function PhoneMockup() {
  return (
    <div className="relative">
      <Badge color="g" style={{ top: "-18px", right: "-18px" }}>🎓 New lesson posted!</Badge>
      <Badge color="amber" style={{ bottom: "30px", left: "-25px" }}>📵 4.2 hrs of scrolling replaced</Badge>
      <Badge color="purple" style={{ bottom: "-10px", right: "8px" }}>★ Sofia P., 16, just graduated!</Badge>
      <div className="relative shadow-phone" style={{ background: "var(--surface-2)", border: "1px solid var(--border-2)", borderRadius: 34, padding: 12 }}>
        <div className="overflow-hidden" style={{ background: "var(--surface-1)", borderRadius: 25 }}>
          <div style={{ background: "linear-gradient(135deg,#071a10,#0e3524)", padding: "20px 16px 16px" }}>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.45)", marginBottom: 3 }}>
              SkillFeed — replacing your For You page
            </div>
            <div className="font-display font-bold text-white mb-3" style={{ fontSize: 13, lineHeight: 1.3 }}>
              Real people teaching real skills. No ads. No drama. No algorithm traps.
            </div>
            <div className="inline-flex items-center gap-[7px]" style={{ background: "rgba(255,255,255,0.09)", borderRadius: 8, padding: "7px 11px" }}>
              <div className="font-display font-extrabold text-g" style={{ fontSize: 16 }}>47</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.55)" }}>free lessons today</div>
            </div>
          </div>
          <div style={{ padding: "12px 14px", background: "var(--surface-1)" }}>
            <div className="font-display font-bold mb-2 text-t1" style={{ fontSize: 11 }}>
              Today's lessons from your community
            </div>
            <PhoneFeedMini av="JM" avBg="linear-gradient(135deg,#0e7a4e,#1fc87e)" name="John Martinez" role="Master Electrician" title="How to safely test a circuit breaker" sub="3 min · 847 learners watched today" />
            <PhoneFeedMini av="SC" avBg="linear-gradient(135deg,#6d28d9,#9b6cf5)" name="Sarah Chen" role="Web Dev · Teaching teens" title="Build a website in 10 minutes" sub="4 min · ★ Youth Zone · 1,340 watched" />
          </div>
          <div className="flex" style={{ background: "rgba(255,255,255,0.03)", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
            {[
              { label: "Feed", icon: "◈", active: true },
              { label: "Learn", icon: "⊕" },
              { label: "Teach", icon: "🎓" },
              { label: "Youth", icon: "★" },
              { label: "Jobs", icon: "◐" },
            ].map((t) => (
              <div
                key={t.label}
                className="flex-1 flex flex-col items-center gap-[2px] py-2 text-[8px]"
                style={{ color: t.active ? "#1fc87e" : "rgba(255,255,255,0.25)" }}
              >
                <div style={{ fontSize: 13 }}>{t.icon}</div>
                {t.label}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Badge({
  children,
  color,
  style,
}: {
  children: React.ReactNode;
  color: "g" | "amber" | "purple";
  style?: React.CSSProperties;
}) {
  const colorVar =
    color === "g" ? "var(--g)" : color === "amber" ? "var(--amber)" : "var(--purple)";
  return (
    <div
      className="absolute z-[2] font-semibold whitespace-nowrap shadow-float glass"
      style={{
        ...style,
        color: colorVar,
        borderRadius: 11,
        padding: "9px 12px",
        fontSize: 11,
      }}
      suppressHydrationWarning
    >
      {children}
    </div>
  );
}

function PhoneFeedMini({ av, avBg, name, role, title, sub }: { av: string; avBg: string; name: string; role: string; title: string; sub: string }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 9, padding: "10px 12px", marginBottom: 7 }}>
      <div className="flex items-center gap-[7px] mb-[6px]">
        <div className="w-[22px] h-[22px] rounded-full flex items-center justify-center text-white font-bold flex-shrink-0" style={{ fontSize: 8, background: avBg }}>
          {av}
        </div>
        <div>
          <div className="text-[10px] font-bold text-t1">{name}</div>
          <div style={{ fontSize: 9, color: "rgba(255,255,255,0.35)" }}>{role}</div>
        </div>
        <div className="ml-auto text-g font-bold" style={{ fontSize: 8, padding: "1px 5px", borderRadius: 3, background: "rgba(31,200,126,0.1)" }}>
          Volunteer
        </div>
      </div>
      <div className="text-[11px] font-bold text-t1 mb-[3px]">{title}</div>
      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>{sub}</div>
    </div>
  );
}
