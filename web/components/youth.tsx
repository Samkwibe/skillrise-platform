"use client";
import { useState } from "react";
import { youthTracks } from "@/lib/data";

export function Youth() {
  return (
    <section id="youth" className="section-pad" style={{ background: "linear-gradient(135deg,#0e0a20,#100c28)" }}>
      <div className="mx-wrap">
        <div className="grid gap-12 items-center youth-grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
          <div>
            <div className="stag">Youth Zone ★</div>
            <h2 className="sh text-white">
              For teenagers who are tired of being told to just scroll less.
            </h2>
            <p className="ss mb-6">
              SkillRise gives teens and high school students a real alternative —
              practical tracks designed for ages 13–18 that build confidence, skills, and
              a future that no college degree can take away.
            </p>
            <div className="flex flex-col gap-3 mb-7">
              {youthTracks.map((t) => (
                <div key={t.title} className="flex items-start gap-3">
                  <div
                    className="flex items-center justify-center flex-shrink-0"
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 9,
                      background: `rgba(${t.color},0.1)`,
                      fontSize: 16,
                    }}
                  >
                    {t.icon}
                  </div>
                  <div>
                    <div className="font-bold text-[15px]">{t.title}</div>
                    <div className="text-[13px]" style={{ color: "rgba(255,255,255,0.4)" }}>
                      {t.sub}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-[11px] flex-wrap">
              <a href="#download" className="btn btn-primary btn-xl">
                Join Youth Zone →
              </a>
              <a
                href="#"
                className="btn btn-ghost btn-xl"
                style={{ borderColor: "rgba(255,255,255,0.15)" }}
              >
                For schools
              </a>
            </div>
          </div>

          <div>
            <ChallengeCard />
            <SchoolCard />
          </div>
        </div>
      </div>
      <style>{`@media(max-width:768px){.youth-grid{grid-template-columns:1fr !important;}}`}</style>
    </section>
  );
}

function ChallengeCard() {
  const [joined, setJoined] = useState(false);
  const [loading, setLoading] = useState(false);

  const join = async () => {
    setLoading(true);
    try {
      await fetch("/api/challenge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "30-day-social-swap" }),
      });
      setJoined(true);
    } catch {
      setJoined(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="mb-4"
      style={{
        background: "rgba(155,108,245,0.06)",
        border: "1px solid rgba(155,108,245,0.15)",
        borderRadius: 20,
        padding: 24,
      }}
    >
      <div className="font-display font-bold text-purple mb-3 text-[14px]">
        📵 The Social Media Swap — 30 Day Challenge
      </div>
      <div
        className="text-[14px] mb-4 leading-[1.6]"
        style={{ color: "rgba(255,255,255,0.55)" }}
      >
        Trade 30 minutes of social media for 30 minutes of SkillRise. In 30 days you'll
        have a real skill. In 90 days you could have your first income.
      </div>
      <div className="flex flex-col gap-2 mb-4">
        <ChallengeRow checked text="30 minutes less scrolling per day" />
        <ChallengeRow checked text="30 minutes on SkillRise every day" />
        <ChallengeRow text="By Day 30 — a real skill unlocked" />
      </div>
      <button
        onClick={join}
        disabled={joined || loading}
        className="btn btn-xl w-full"
        style={{
          background: joined ? "rgba(155,108,245,0.4)" : "#9b6cf5",
          color: "white",
          fontSize: 14,
          fontWeight: 700,
          borderRadius: 10,
          cursor: joined ? "default" : "pointer",
        }}
      >
        {joined ? "You're in — check your email" : loading ? "Joining…" : "Take the 30-day challenge"}
      </button>
    </div>
  );
}

function ChallengeRow({ checked, text }: { checked?: boolean; text: string }) {
  return (
    <div
      className="flex items-center gap-[9px]"
      style={{ background: "rgba(255,255,255,0.04)", borderRadius: 8, padding: "10px 12px" }}
    >
      <div
        className="flex items-center justify-center flex-shrink-0"
        style={{
          width: 18,
          height: 18,
          borderRadius: 4,
          background: checked ? "#9b6cf5" : "rgba(255,255,255,0.15)",
          color: checked ? "white" : "rgba(255,255,255,0.4)",
          fontSize: 10,
          fontWeight: 700,
        }}
      >
        {checked ? "✓" : "·"}
      </div>
      <div
        className="text-[13px]"
        style={{ color: checked ? undefined : "rgba(255,255,255,0.4)" }}
      >
        {text}
      </div>
    </div>
  );
}

function SchoolCard() {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 20,
        padding: 20,
      }}
    >
      <div className="text-[13px] font-bold text-t2 mb-3">For teachers & schools</div>
      <div className="text-[13px] text-t3 mb-[14px] leading-[1.6]">
        Assign SkillRise to students as part of career education. Free for all schools.
        Track progress, award certificates, and see which students are on track for
        employment.
      </div>
      <a href="#" className="btn btn-ghost btn-sm">
        School partnership program →
      </a>
    </div>
  );
}
