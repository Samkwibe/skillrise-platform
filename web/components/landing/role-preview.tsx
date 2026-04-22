"use client";

import Link from "next/link";
import { useState } from "react";

type RoleKey = "learner" | "teen" | "teacher" | "employer" | "school";

type RolePreview = {
  key: RoleKey;
  tab: string;
  tagline: string;
  description: string;
  background: string;
  accent: string;
  textColor: string;
  mutedText: string;
  surface: string;
  borderColor: string;
  cta: { href: string; label: string };
};

const ROLES: RolePreview[] = [
  {
    key: "learner",
    tab: "Learner",
    tagline: "A course platform built around your next module.",
    description:
      "Big cover cards, progress rings, and a job wall that updates when you earn certs.",
    background: "linear-gradient(135deg, #0a1628, #13213a 70%, #1b2c4a)",
    accent: "#f59e0b",
    textColor: "#eef2fb",
    mutedText: "rgba(238,242,251,0.62)",
    surface: "rgba(255,255,255,0.04)",
    borderColor: "rgba(255,255,255,0.08)",
    cta: { href: "/signup?role=learner", label: "Start learning" },
  },
  {
    key: "teen",
    tab: "Teen",
    tagline: "A gamified app. XP, streaks, quests, trophies.",
    description:
      "No jobs. No tutors. Just a vivid learning game designed for ages 13–17.",
    background:
      "radial-gradient(600px 300px at 10% 0%, rgba(168,85,247,0.55), transparent 60%), radial-gradient(500px 300px at 100% 30%, rgba(255,62,165,0.4), transparent 60%), #140a28",
    accent: "#c0ff00",
    textColor: "#ffffff",
    mutedText: "rgba(215,200,255,0.7)",
    surface: "rgba(255,255,255,0.05)",
    borderColor: "rgba(192,132,252,0.3)",
    cta: { href: "/signup?role=teen", label: "Enter the zone" },
  },
  {
    key: "teacher",
    tab: "Teacher",
    tagline: "A broadcast studio. ● GO LIVE is a button, not a plan.",
    description:
      "Dark OBS-style studio with a preview panel, take counter, and enrollment telemetry.",
    background: "linear-gradient(135deg, #0a0a0a, #141414 70%, #1c1c1c)",
    accent: "#ef4444",
    textColor: "#fafafa",
    mutedText: "rgba(255,255,255,0.5)",
    surface: "rgba(255,255,255,0.03)",
    borderColor: "rgba(255,255,255,0.08)",
    cta: { href: "/signup?role=teacher", label: "Open the studio" },
  },
  {
    key: "employer",
    tab: "Employer",
    tagline: "A recruiting dashboard. Kanban pipeline + time-to-hire.",
    description:
      "Light HR chrome. No learning content. Candidates are sorted by certificate match.",
    background: "linear-gradient(180deg, #f8fafc, #e2e8f0)",
    accent: "#1d4ed8",
    textColor: "#0f172a",
    mutedText: "rgba(15,23,42,0.55)",
    surface: "rgba(255,255,255,0.9)",
    borderColor: "rgba(15,23,42,0.08)",
    cta: { href: "/signup?role=employer", label: "Post a role" },
  },
  {
    key: "school",
    tab: "School",
    tagline: "An admin portal. Tables, rosters, reports.",
    description:
      "Workspace-admin feel. Bulk enroll, export CSV, cohort completion — no video feed.",
    background: "linear-gradient(180deg, #f1f5f9, #dce3ec)",
    accent: "#0f766e",
    textColor: "#0f1a2b",
    mutedText: "rgba(15,26,43,0.55)",
    surface: "rgba(255,255,255,0.95)",
    borderColor: "rgba(15,25,40,0.1)",
    cta: { href: "/signup?role=school", label: "Open admin" },
  },
];

export function RolePreview() {
  const [active, setActive] = useState<RoleKey>("learner");
  const current = ROLES.find((r) => r.key === active) ?? ROLES[0];

  return (
    <section className="section-pad dash-wrap" id="role-preview">
      <div className="text-center max-w-[680px] mx-auto mb-8">
        <span className="stag">Five products. One SkillRise.</span>
        <h2 className="sh">Log in as anyone. See a <span className="gradient-text">completely different</span> platform.</h2>
        <p className="ss mx-auto">
          Same codebase. Same data. Five distinct visual languages — because a 14-year-old
          earning XP and a recruiter running a hiring pipeline shouldn't see the same app.
        </p>
      </div>

      <div
        className="flex flex-nowrap sm:flex-wrap gap-2 justify-start sm:justify-center mb-6 overflow-x-auto sm:overflow-visible no-scrollbar -mx-4 sm:mx-0 px-4 sm:px-0"
        role="tablist"
        aria-label="Role preview"
      >
        {ROLES.map((r) => (
          <button
            key={r.key}
            type="button"
            role="tab"
            aria-selected={r.key === active}
            onClick={() => setActive(r.key)}
            className="shrink-0 px-4 py-2 rounded-full text-[13px] font-bold transition-all whitespace-nowrap"
            style={{
              background: r.key === active ? "var(--g)" : "var(--surface-2)",
              color: r.key === active ? "var(--bg)" : "var(--text-2)",
              border: r.key === active ? "1px solid var(--g)" : "1px solid var(--border-1)",
              transform: r.key === active ? "translateY(-1px)" : "none",
              boxShadow: r.key === active ? "0 8px 20px rgba(31,200,126,0.18)" : "none",
            }}
          >
            {r.tab}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] xl:grid-cols-[1fr_420px] 3xl:grid-cols-[1fr_500px] gap-4 md:gap-5 items-start">
        <div
          key={current.key}
          className="rounded-[18px] overflow-hidden animate-fade-in-up min-h-[380px] sm:min-h-[420px] 3xl:min-h-[520px]"
          style={{
            background: current.background,
            border: `1px solid ${current.borderColor}`,
            color: current.textColor,
            boxShadow: "0 30px 70px rgba(8,12,30,0.28)",
          }}
        >
          <PreviewInner role={current} />
        </div>

        <div className="card p-6">
          <div className="text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color: "var(--g)" }}>
            {current.tab} dashboard
          </div>
          <h3 className="text-[22px] font-extrabold mt-1" style={{ fontFamily: "var(--font-syne)", letterSpacing: "-0.01em" }}>
            {current.tagline}
          </h3>
          <p className="text-[14px] mt-2" style={{ color: "var(--text-2)" }}>
            {current.description}
          </p>
          <ul className="mt-4 flex flex-col gap-2 text-[13px]" style={{ color: "var(--text-2)" }}>
            {PREVIEW_BULLETS[current.key].map((b) => (
              <li key={b} className="flex items-start gap-2">
                <span className="shrink-0" style={{ color: "var(--g)" }}>✓</span>
                <span>{b}</span>
              </li>
            ))}
          </ul>
          <div className="flex gap-2 mt-5">
            <Link href={current.cta.href} className="btn btn-primary btn-sm">
              {current.cta.label}
            </Link>
            <Link href="/login" className="btn btn-ghost btn-sm">
              Try the demo
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

const PREVIEW_BULLETS: Record<RoleKey, string[]> = {
  learner: [
    "Resume where you left off strip",
    "Progress rings per track",
    "Local jobs auto-matched to your certs",
    "Built-in AI tutor, streaming",
  ],
  teen: [
    "XP bar, levels, and daily quests",
    "Streak fire with freezes",
    "Trophy case of unlocked badges",
    "No jobs. No AI. Just learning as a game.",
  ],
  teacher: [
    "Always-visible Go Live button",
    "Preview panel with take counter",
    "Video library with view counts",
    "Monospace enrollment telemetry",
  ],
  employer: [
    "Five-column kanban pipeline",
    "Candidate drawer with cert match",
    "Funnel + time-to-hire gauge",
    "Zero learning-platform clutter",
  ],
  school: [
    "Roster table with bulk actions",
    "Cohort completion chart",
    "Audit log for compliance",
    "Export CSV, print reports",
  ],
};

function PreviewInner({ role }: { role: RolePreview }) {
  switch (role.key) {
    case "learner":
      return <LearnerMini role={role} />;
    case "teen":
      return <TeenMini role={role} />;
    case "teacher":
      return <TeacherMini role={role} />;
    case "employer":
      return <EmployerMini role={role} />;
    case "school":
      return <SchoolMini role={role} />;
  }
}

function LearnerMini({ role }: { role: RolePreview }) {
  return (
    <div className="p-5 flex flex-col gap-3 h-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-[10px] flex items-center justify-center font-extrabold" style={{ background: role.accent, color: "#1a1410" }}>
            S
          </div>
          <div className="text-[14px] font-extrabold" style={{ fontFamily: "var(--font-syne)" }}>SkillRise</div>
        </div>
        <div className="flex gap-1.5">
          {["My Learning", "Tracks", "Feed", "Live", "Tutor", "Jobs"].map((t, i) => (
            <div key={t} className="px-2 py-1 rounded text-[11px]" style={{ color: i === 0 ? role.textColor : role.mutedText, background: i === 0 ? role.surface : "transparent" }}>
              {t}
            </div>
          ))}
        </div>
      </div>

      <div
        className="rounded-[12px] p-4 flex items-center justify-between"
        style={{ background: role.surface, border: `1px solid ${role.borderColor}` }}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-[8px] flex items-center justify-center text-[14px]" style={{ background: "rgba(245,158,11,0.22)" }}>⚡</div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: role.mutedText }}>Resume</div>
            <div className="text-[12.5px] font-semibold">Electrical Basics — Wire gauges</div>
          </div>
        </div>
        <div className="px-3 py-1.5 rounded-full text-[11px] font-bold" style={{ background: role.accent, color: "#1a1410" }}>
          62% · Continue →
        </div>
      </div>

      <div className="grid grid-cols-[1.5fr_1fr] gap-3 flex-1">
        <div className="rounded-[14px] p-0 overflow-hidden relative" style={{ background: `linear-gradient(135deg, rgba(245,158,11,0.7), rgba(245,158,11,0.25))`, border: `1px solid ${role.borderColor}` }}>
          <div className="p-4">
            <div className="text-[10px] font-bold uppercase tracking-wider text-white/80">Beginner · 6 wks</div>
            <div className="text-[22px] font-extrabold text-white mt-1" style={{ fontFamily: "var(--font-syne)" }}>Electrical Basics</div>
          </div>
          <div className="absolute top-4 right-4 text-[40px]">⚡</div>
          <div className="absolute bottom-4 left-4 right-4 flex items-center gap-2">
            <MiniRing pct={62} accent={role.accent} text={role.textColor} />
            <div className="text-[11px]" style={{ color: "rgba(255,255,255,0.75)" }}>3 of 5 modules</div>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <div className="rounded-[10px] p-3" style={{ background: role.surface, border: `1px solid ${role.borderColor}` }}>
            <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: role.mutedText }}>AI Tutor</div>
            <div className="text-[12px] mt-1" style={{ color: role.textColor }}>"Explain single-phase wiring"</div>
            <div className="flex gap-1 mt-1.5">
              {[0, 1, 2].map((i) => (
                <div key={i} className="w-1.5 h-1.5 rounded-full" style={{ background: role.accent, opacity: 0.3 + i * 0.2, animation: `fadeIn 1.2s ${i * 0.15}s ease both` }} />
              ))}
            </div>
          </div>
          <div className="rounded-[10px] p-3" style={{ background: role.surface, border: `1px solid ${role.borderColor}` }}>
            <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: role.mutedText }}>Jobs near you</div>
            <div className="text-[12px] font-semibold mt-1" style={{ color: role.textColor }}>Apprentice Electrician</div>
            <div className="text-[10.5px]" style={{ color: role.mutedText }}>Apex · $22–28/hr</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TeenMini({ role }: { role: RolePreview }) {
  return (
    <div className="p-5 flex flex-col gap-3 h-full" style={{ fontFamily: "var(--font-nunito)" }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="w-10 h-10 rounded-[14px] flex items-center justify-center font-black text-[18px]"
            style={{ background: "#c0ff00", color: "#140a28", transform: "rotate(-6deg)", boxShadow: "3px 3px 0 0 #ff3ea5" }}
          >
            S
          </div>
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.16em]" style={{ color: "#c0ff00" }}>Youth Zone</div>
            <div className="text-[15px] font-black leading-none">Hey Sofia!</div>
          </div>
        </div>
      </div>

      <div
        className="rounded-[18px] p-4 flex items-center gap-3"
        style={{ border: "3px solid #c0ff00", boxShadow: "5px 5px 0 0 rgba(255,62,165,0.4)", background: "rgba(255,255,255,0.04)" }}
      >
        <div
          className="w-12 h-12 rounded-[14px] flex items-center justify-center font-black text-[22px]"
          style={{ background: "#c0ff00", color: "#140a28", boxShadow: "3px 3px 0 0 #ff3ea5" }}
        >
          4
        </div>
        <div className="flex-1">
          <div className="text-[10px] font-black uppercase tracking-[0.18em]" style={{ color: "#c0ff00" }}>Level 4 · 150/250 XP</div>
          <div className="h-3 rounded-full mt-1.5 overflow-hidden" style={{ background: "rgba(255,255,255,0.12)" }}>
            <div className="h-full rounded-full" style={{ width: "60%", background: "linear-gradient(90deg, #c0ff00, #22d3ee 60%, #ff3ea5)" }} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {[
          { emoji: "🔥", label: "DAY STREAK", value: "7", color: "#ff3ea5" },
          { emoji: "🏆", label: "TROPHIES", value: "3", color: "#22d3ee" },
        ].map((t) => (
          <div
            key={t.label}
            className="rounded-[18px] p-3 text-center"
            style={{ border: `3px solid ${t.color}`, boxShadow: `4px 4px 0 0 rgba(255,255,255,0.06)`, background: "rgba(255,255,255,0.04)" }}
          >
            <div className="text-[26px] leading-none" style={{ animation: "fireFlicker 1.8s ease-in-out infinite" }}>{t.emoji}</div>
            <div className="text-[20px] font-black mt-1" style={{ color: t.color }}>{t.value}</div>
            <div className="text-[9px] font-black tracking-widest" style={{ color: role.mutedText }}>{t.label}</div>
          </div>
        ))}
      </div>

      <div
        className="rounded-[18px] p-3 flex items-center gap-2 mt-auto"
        style={{ border: "3px solid #a855f7", background: "rgba(255,255,255,0.04)" }}
      >
        <div
          className="w-10 h-10 rounded-[12px] flex items-center justify-center text-[18px] shrink-0"
          style={{ background: "#a855f7", transform: "rotate(6deg)", boxShadow: "3px 3px 0 0 #c0ff00" }}
        >
          ⚡
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[9px] font-black uppercase tracking-widest" style={{ color: "#c0ff00" }}>⚔ Today's quest</div>
          <div className="text-[13px] font-black leading-tight">Finish "Mobile photography basics"</div>
        </div>
        <div className="px-3 py-1.5 rounded-full text-[10px] font-black uppercase" style={{ background: "#c0ff00", color: "#140a28" }}>+25 XP</div>
      </div>
    </div>
  );
}

function TeacherMini({ role }: { role: RolePreview }) {
  return (
    <div className="p-5 grid grid-cols-[1fr_2fr] gap-3 h-full" style={{ fontFamily: "var(--font-jetbrains)" }}>
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 pb-2" style={{ borderBottom: `1px solid ${role.borderColor}` }}>
          <span className="w-2 h-2 rounded-full" style={{ background: role.accent, boxShadow: `0 0 12px ${role.accent}` }} />
          <div className="text-[10px] font-bold tracking-[0.15em]" style={{ color: role.accent }}>SR STUDIO</div>
        </div>
        {["Overview", "Record", "Live", "Library", "Cohorts", "Analytics"].map((i, n) => (
          <div key={i} className="text-[11px] flex items-center gap-2" style={{ color: n === 0 ? role.textColor : role.mutedText }}>
            <span className="w-4 text-center opacity-60">{["▤", "●", "▶", "▦", "▩", "⚙"][n]}</span>
            {i}
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-3 gap-2">
          {[
            { l: "VIEWS", v: "12.4K", c: role.accent },
            { l: "STUDENTS", v: "248", c: "#f59e0b" },
            { l: "LESSONS", v: "17", c: "#3b82f6" },
          ].map((k) => (
            <div key={k.l} className="rounded-[6px] p-2" style={{ background: role.surface, border: `1px solid ${role.borderColor}` }}>
              <div className="text-[9px] tracking-widest" style={{ color: role.mutedText }}>{k.l}</div>
              <div className="text-[18px] font-medium tabular-nums" style={{ color: k.c }}>{k.v}</div>
            </div>
          ))}
        </div>

        <div
          className="rounded-[8px] overflow-hidden flex-1 relative"
          style={{ background: "linear-gradient(135deg, #1a1a1a, #0a0a0a)", border: `1px solid ${role.borderColor}` }}
        >
          <div className="flex items-center justify-between px-3 h-[28px]" style={{ background: "rgba(255,255,255,0.03)", borderBottom: `1px solid ${role.borderColor}` }}>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: role.accent, boxShadow: `0 0 0 0 ${role.accent}`, animation: "livePulse 1.6s infinite" }} />
              <span className="text-[9px] tracking-[0.15em]" style={{ color: role.accent }}>● ON AIR</span>
            </div>
            <span className="text-[9px]" style={{ color: role.mutedText }}>PREVIEW</span>
          </div>
          <div className="flex items-center justify-center" style={{ height: 124 }}>
            <div className="text-center">
              <div className="text-[38px]">⚡</div>
              <div className="text-[12px] mt-1" style={{ color: role.textColor }}>Wire gauge basics</div>
              <div className="text-[9px] tracking-widest mt-1" style={{ color: role.mutedText }}>12:34 · 8.2K views</div>
            </div>
          </div>
          <div className="flex items-center justify-between px-3 py-1.5" style={{ borderTop: `1px solid ${role.borderColor}` }}>
            <div className="text-[9px] tracking-widest" style={{ color: role.mutedText }}>● NEW TAKE</div>
            <div className="text-[9px] px-2 py-0.5 rounded" style={{ background: role.accent, color: "#fff" }}>GO LIVE</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmployerMini({ role }: { role: RolePreview }) {
  const columns = [
    { label: "Applied", count: 24, cards: ["Tanya W.", "Rico J."], color: "#0ea5e9" },
    { label: "Shortlisted", count: 11, cards: ["Mariah S."], color: "#b45309" },
    { label: "Interview", count: 4, cards: ["Luis P."], color: "#7c3aed" },
    { label: "Hired", count: 2, cards: ["Ada K."], color: "#1d4ed8" },
  ];
  return (
    <div className="p-5 flex flex-col gap-4 h-full">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: role.accent }}>Talent Hub</div>
          <div className="text-[16px] font-extrabold" style={{ color: role.textColor }}>Apex Electric</div>
        </div>
        <div className="px-3 py-1.5 rounded-[8px] text-[11px] font-semibold" style={{ background: role.accent, color: "#fff" }}>
          + Post a role
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 flex-1">
        {columns.map((c) => (
          <div key={c.label} className="rounded-[10px] p-2 flex flex-col gap-1.5" style={{ background: role.surface, border: `1px solid ${role.borderColor}` }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: c.color }} />
                <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: role.mutedText }}>{c.label}</span>
              </div>
              <span className="text-[9px] font-bold" style={{ color: role.mutedText }}>{c.count}</span>
            </div>
            {c.cards.map((card) => (
              <div
                key={card}
                className="rounded-[6px] p-1.5 flex items-center gap-1.5"
                style={{ background: "#fff", border: `1px solid ${role.borderColor}` }}
              >
                <div className="w-5 h-5 rounded-full" style={{ background: c.color }} />
                <div className="text-[10px] font-semibold truncate" style={{ color: role.textColor }}>{card}</div>
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 rounded-[10px] p-3" style={{ background: role.surface, border: `1px solid ${role.borderColor}` }}>
        <div className="flex-1">
          <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: role.mutedText }}>Time to hire</div>
          <div className="text-[20px] font-extrabold" style={{ color: role.textColor }}>
            14<span className="text-[12px] font-semibold ml-1" style={{ color: role.mutedText }}>days avg</span>
          </div>
        </div>
        <div className="flex items-end gap-0.5 h-10">
          {[20, 30, 25, 35, 45, 40, 55].map((h, i) => (
            <div key={i} className="w-2 rounded-t" style={{ height: `${h}%`, background: role.accent, opacity: 0.5 + i * 0.07 }} />
          ))}
        </div>
      </div>
    </div>
  );
}

function SchoolMini({ role }: { role: RolePreview }) {
  const rows = [
    { name: "Maria K.", cls: "10A", prog: 92, cert: true },
    { name: "Jordan V.", cls: "10B", prog: 68, cert: false },
    { name: "Alex T.", cls: "10A", prog: 100, cert: true },
    { name: "Priya R.", cls: "11C", prog: 44, cert: false },
  ];
  return (
    <div className="p-5 flex flex-col gap-3 h-full">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: role.mutedText }}>Administration · Overview</div>
          <div className="text-[16px] font-bold" style={{ color: role.textColor }}>Central High School</div>
        </div>
        <div className="flex gap-2">
          <div className="px-2 py-1 rounded text-[11px]" style={{ color: role.mutedText, border: `1px solid ${role.borderColor}` }}>Export CSV</div>
          <div className="px-2 py-1 rounded text-[11px] font-semibold" style={{ background: role.accent, color: "#fff" }}>+ Add class</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {[
          { l: "Students", v: 128 },
          { l: "Certificates", v: 47, c: role.accent },
          { l: "Completion", v: "73%" },
        ].map((k) => (
          <div key={k.l} className="rounded-[6px] p-2.5" style={{ background: role.surface, border: `1px solid ${role.borderColor}` }}>
            <div className="text-[9px] font-bold uppercase tracking-wider" style={{ color: role.mutedText }}>{k.l}</div>
            <div className="text-[18px] font-bold tabular-nums" style={{ color: k.c ?? role.textColor }}>{k.v}</div>
          </div>
        ))}
      </div>

      <div className="rounded-[6px] overflow-hidden flex-1" style={{ background: role.surface, border: `1px solid ${role.borderColor}` }}>
        <div className="grid grid-cols-[auto_1.2fr_0.6fr_1fr_0.6fr] gap-2 px-3 py-1.5" style={{ background: "rgba(15,25,40,0.04)", borderBottom: `1px solid ${role.borderColor}` }}>
          <span />
          <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: role.mutedText }}>Name</span>
          <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: role.mutedText }}>Class</span>
          <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: role.mutedText }}>Progress</span>
          <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: role.mutedText }}>Status</span>
        </div>
        {rows.map((r, i) => (
          <div key={r.name} className="grid grid-cols-[auto_1.2fr_0.6fr_1fr_0.6fr] gap-2 items-center px-3 py-2" style={{ borderBottom: i === rows.length - 1 ? "none" : `1px solid ${role.borderColor}` }}>
            <input type="checkbox" readOnly className="scale-90" />
            <span className="text-[11.5px] font-semibold" style={{ color: role.textColor }}>{r.name}</span>
            <span className="text-[11px] tabular-nums" style={{ color: role.mutedText }}>{r.cls}</span>
            <div className="flex items-center gap-1">
              <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: "rgba(15,25,40,0.1)" }}>
                <div className="h-full" style={{ width: `${r.prog}%`, background: role.accent }} />
              </div>
              <span className="text-[10px] tabular-nums" style={{ color: role.mutedText }}>{r.prog}%</span>
            </div>
            <span className="text-[9.5px] font-semibold px-1.5 py-0.5 rounded-full text-center"
              style={{
                background: r.cert ? "rgba(15,118,110,0.14)" : "rgba(15,25,40,0.06)",
                color: r.cert ? role.accent : role.mutedText,
              }}
            >
              {r.cert ? "Certified" : "In progress"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MiniRing({ pct, accent, text }: { pct: number; accent: string; text: string }) {
  const size = 28;
  const r = 11;
  const c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,0.25)" strokeWidth={3} fill="none" />
      <circle cx={size / 2} cy={size / 2} r={r} stroke={accent} strokeWidth={3} strokeLinecap="round" fill="none" strokeDasharray={c} strokeDashoffset={c - (pct / 100) * c} />
      <text x={size / 2} y={size / 2} textAnchor="middle" dominantBaseline="middle" transform={`rotate(90 ${size / 2} ${size / 2})`} style={{ fontSize: 9, fontWeight: 700, fill: text }}>
        {pct}
      </text>
    </svg>
  );
}
