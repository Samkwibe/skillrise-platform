const FEATURES = [
  {
    eyebrow: "Learn",
    title: "Skill tracks that actually pay off",
    body: "Every track is co-designed with people already doing the work: electricians, web devs, childcare pros. Finish and get a verifiable certificate with a live QR hiring page.",
    icon: "🧭",
    accent: "var(--g)",
  },
  {
    eyebrow: "Teach",
    title: "Record once. Help someone for years.",
    body: "Teachers upload short, honest lessons. No production budget, no algorithm, no ads. Just your voice, your craft, and learners who actually show up.",
    icon: "🎤",
    accent: "var(--purple)",
  },
  {
    eyebrow: "AI Tutor",
    title: "A study buddy that knows your track",
    body: "Quiz me. Explain Ohm's law. Practice my interview. The tutor is context-aware — it pulls in your track, modules, and notes to coach you step-by-step.",
    icon: "🤖",
    accent: "var(--blue)",
  },
  {
    eyebrow: "Jobs",
    title: "Local employers who've pre-commited to hire",
    body: "Finish a track → apply with one tap → your certificate + transcript is already attached. Employers tag roles with 'hire guarantee' so you know who's serious.",
    icon: "💼",
    accent: "var(--amber)",
  },
  {
    eyebrow: "Youth Zone",
    title: "A replacement for the scroll, built for 13–18",
    body: "Ad-free, teen-safe, phone-minimalist. 30-day 'Social Swap' challenge, first-paid-gig goal, and SkillFeed lessons curated for younger builders.",
    icon: "★",
    accent: "var(--purple)",
  },
  {
    eyebrow: "Community",
    title: "Cohorts in every neighborhood",
    body: "Meet 10–15 people learning the same thing, nearby. Live sessions, cohort chat, shared wins. Real names, real places, no DMs from strangers.",
    icon: "🏘",
    accent: "var(--g)",
  },
] as const;

export function Features() {
  return (
    <section id="features" className="section-pad">
      <div className="mx-wrap">
        <div className="text-center mb-14 reveal">
          <div className="stag justify-center">What you get</div>
          <h2 className="sh mx-auto">Built for real life — not the algorithm.</h2>
          <p className="ss mx-auto">
            SkillRise combines the six things that matter most: a skill, a teacher, a tutor, a cohort, a certificate, and a job. For free.
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f) => (
            <article
              key={f.title}
              className="card card-hover p-6 reveal relative overflow-hidden"
            >
              <div
                aria-hidden
                className="absolute -top-10 -right-10 w-28 h-28 rounded-full opacity-20 blur-2xl"
                style={{ background: f.accent }}
              />
              <div
                className="w-11 h-11 rounded-[12px] flex items-center justify-center text-[22px] mb-4"
                style={{ background: `color-mix(in srgb, ${f.accent} 14%, transparent)`, color: f.accent }}
              >
                {f.icon}
              </div>
              <div className="text-[11px] font-bold uppercase tracking-[0.1em] mb-1" style={{ color: f.accent }}>
                {f.eyebrow}
              </div>
              <h3 className="text-[18px] font-bold text-t1 mb-2">{f.title}</h3>
              <p className="text-[14px] text-t2 leading-relaxed">{f.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
