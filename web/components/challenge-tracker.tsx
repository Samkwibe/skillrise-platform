"use client";
import { useState } from "react";

export function ChallengeTracker({ day }: { day: number }) {
  const [current, setCurrent] = useState(day);
  const [busy, setBusy] = useState(false);
  return (
    <div className="card p-6 max-w-[840px]">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-[12px] uppercase tracking-wider text-t3">Your streak</div>
          <div className="font-display text-[40px] font-extrabold">Day {current} / 30</div>
        </div>
        <button
          type="button"
          disabled={busy || current >= 30}
          onClick={async () => {
            setBusy(true);
            const res = await fetch("/api/challenge/progress", { method: "POST" });
            const body = await res.json();
            setBusy(false);
            if (res.ok) setCurrent(body.day);
          }}
          className="btn btn-primary btn-xl"
        >
          {current >= 30 ? "🎉 Challenge complete" : busy ? "Saving…" : "Log today's 30 min"}
        </button>
      </div>
      <div className="grid grid-cols-10 gap-2">
        {Array.from({ length: 30 }).map((_, i) => {
          const d = i + 1;
          const done = d <= current;
          return (
            <div
              key={d}
              className={`aspect-square rounded-[10px] flex items-center justify-center text-[13px] font-bold ${
                done ? "bg-g text-ink" : "bg-[rgba(255,255,255,0.04)] text-t3 border border-border1"
              }`}
            >
              {d}
            </div>
          );
        })}
      </div>
      <p className="text-[13px] text-t3 mt-5">
        Tip: open SkillRise before Instagram or TikTok. Even 5 minutes on a SkillFeed lesson counts.
      </p>
    </div>
  );
}
