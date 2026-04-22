import Link from "next/link";
import { LIFE_CATEGORIES } from "@/lib/store";

/**
 * Landing section introducing the seven "anyone can learn this" pillars.
 * Intentionally leads with mental health, communication, money and
 * job-readiness — not tech — so visitors without a CS background see
 * themselves immediately.
 */
export function LifeSkills() {
  return (
    <section className="section-pad dash-wrap">
      <div className="max-w-[760px] mb-8 md:mb-10">
        <div className="text-[12px] font-bold uppercase tracking-[0.16em] mb-2" style={{ color: "var(--g, #1fc87e)" }}>
          For people, not resumes
        </div>
        <h2
          className="font-extrabold text-[30px] md:text-[42px] leading-[1.05]"
          style={{ fontFamily: "var(--role-font-display)", letterSpacing: "-0.01em" }}
        >
          Basic, practical skills for everyone — no degree required.
        </h2>
        <p className="text-[15px] md:text-[16px] mt-3 md:mt-4" style={{ color: "var(--text-2, #b5bdc8)" }}>
          If you're trying to feel less stuck, talk to people, find a job, budget a paycheck, or fix
          the leak under your sink — there's a 5-minute video here that starts you off. Every track is free.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 3xl:grid-cols-5 gap-3 md:gap-4">
        {LIFE_CATEGORIES.map((c) => (
          <Link
            key={c.id}
            href={`/tracks?cat=${c.id}`}
            className="cover-card p-5 group hover:translate-y-[-2px] transition-transform"
          >
            <div className="text-[32px] mb-2 md:mb-3">{c.emoji}</div>
            <div
              className="font-extrabold text-[16px] md:text-[17px] leading-tight"
              style={{ fontFamily: "var(--role-font-display)" }}
            >
              {c.label}
            </div>
            <div className="text-[12.5px] mt-1.5" style={{ color: "var(--text-3, #98a1ae)" }}>
              {c.blurb}
            </div>
            <div
              className="mt-3 pt-3 text-[11.5px] font-bold uppercase tracking-[0.14em] group-hover:translate-x-1 transition-transform"
              style={{ borderTop: "1px solid var(--border-1)", color: "var(--g, #1fc87e)" }}
            >
              Browse →
            </div>
          </Link>
        ))}
      </div>

      <div
        className="mt-8 md:mt-10 p-5 md:p-6 rounded-[18px]"
        style={{
          background: "color-mix(in srgb, var(--g, #1fc87e) 10%, var(--surface-1, #10161d))",
          border: "1px solid color-mix(in srgb, var(--g, #1fc87e) 25%, transparent)",
        }}
      >
        <div className="grid md:grid-cols-[1fr_auto] gap-4 items-center">
          <div>
            <div className="font-extrabold text-[18px] md:text-[20px]" style={{ fontFamily: "var(--role-font-display)" }}>
              Replace endless scrolling with 5 minutes that change your week.
            </div>
            <div className="text-[13.5px] mt-1" style={{ color: "var(--text-2, #b5bdc8)" }}>
              No ads. No degrees required. Every video has a takeaway you can use the same day.
            </div>
          </div>
          <Link
            href="/signup"
            className="inline-flex items-center justify-center rounded-full px-5 py-3 font-bold text-[14px]"
            style={{ background: "var(--g, #1fc87e)", color: "var(--bg, #0a0f14)" }}
          >
            Start free →
          </Link>
        </div>
      </div>
    </section>
  );
}
