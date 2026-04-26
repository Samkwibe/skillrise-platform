"use client";

import React from "react";
import type { User } from "@/lib/store";

/**
 * Learner activity heatmap — GitHub-style contribution graph styled with premium glassmorphism.
 */

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function deriveHeatmap(user: User, weeks = 12) {
  const seed = [...user.id].reduce((a, c) => a + c.charCodeAt(0), 0);
  const rng = mulberry32(seed);
  
  const days = [];
  const today = new Date();
  
  // Generate `weeks` of data up to today
  for (let i = weeks * 7; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const r = rng();
    // 0: none, 1: low, 2: medium, 3: high, 4: very high
    let level = 0;
    if (r > 0.4) level = 1;
    if (r > 0.65) level = 2;
    if (r > 0.85) level = 3;
    if (r > 0.95) level = 4;
    
    // Simulate current active streak by forcing recent days
    if (i < 5 && i > 0) level = Math.max(1, Math.floor(r * 4) + 1);
    
    days.push({ date: d, level });
  }
  return days;
}

const LEVEL_CLASSES = [
  "bg-white/5 border border-white/5", // 0
  "bg-emerald-900/40 border border-emerald-500/20", // 1
  "bg-emerald-700/60 border border-emerald-500/30", // 2
  "bg-emerald-500/80 border border-emerald-400/50 shadow-[0_0_8px_rgba(16,185,129,0.3)]", // 3
  "bg-emerald-400 border border-emerald-300 shadow-[0_0_12px_rgba(52,211,153,0.6)]", // 4
];

export function LearnerHeatmap({ user }: { user: User }) {
  const data = deriveHeatmap(user, 12);
  
  return (
    <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 backdrop-blur-xl relative overflow-hidden group hover:bg-white/[0.04] transition-colors">
      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none group-hover:bg-emerald-500/10 transition-colors"></div>
      
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <span className="text-emerald-400">🔥</span> Learning Activity
          </h3>
          <p className="text-[11px] text-white/50 mt-0.5">Your daily engagement over the last 12 weeks</p>
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
          5 Day Streak
        </span>
      </div>

      <div className="flex-1 overflow-x-auto scroll-slim pb-2 relative z-10">
        <div className="min-w-[400px]">
          <div className="grid grid-rows-7 grid-flow-col gap-1">
            {data.map((day, i) => (
              <div 
                key={i} 
                className={`w-3 h-3 rounded-[3px] transition-all hover:ring-2 hover:ring-white/50 cursor-pointer hover:scale-125 ${LEVEL_CLASSES[day.level]}`}
                title={`${day.date.toLocaleDateString()}: ${day.level === 0 ? "No" : day.level} activity`}
              />
            ))}
          </div>
        </div>
      </div>
      
      <div className="mt-4 flex items-center gap-2 text-[10px] font-medium text-white/40 justify-end relative z-10">
        <span>Less</span>
        <div className="flex gap-1">
          {LEVEL_CLASSES.map((cls, i) => (
            <div key={i} className={`w-2.5 h-2.5 rounded-[2px] ${cls}`} />
          ))}
        </div>
        <span>More</span>
      </div>
    </div>
  );
}
