"use client";

import React from "react";
import Link from "next/link";
import type { User } from "@/lib/store";
import { userCertificates, getTrack, userEnrollments } from "@/lib/store";

export function LearnerAchievements({ user }: { user: User }) {
  const certs = userCertificates(user.id);
  const enrolls = userEnrollments(user.id);
  const inProgressCount = Math.max(0, enrolls.length - certs.length);

  return (
    <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 backdrop-blur-xl relative overflow-hidden group hover:bg-white/[0.04] transition-colors">
      <div className="absolute top-0 right-0 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none group-hover:bg-amber-500/20 transition-colors"></div>
      
      <div className="flex items-start justify-between mb-5 relative z-10">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-amber-400 mb-1 flex items-center gap-1.5">
            <span>🏆</span> Achievements
          </div>
          <div className="font-display font-extrabold text-white text-[18px] leading-tight drop-shadow-sm">
            {certs.length} Earned · {inProgressCount} In Progress
          </div>
        </div>
        <Link href="/cert" className="text-[12px] text-white/60 hover:text-white underline transition-colors">
          View all
        </Link>
      </div>

      <div className="relative z-10">
        {certs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center border border-dashed border-white/10 rounded-xl bg-white/[0.01]">
            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-[20px] mb-2 grayscale opacity-50">
              🏅
            </div>
            <p className="text-[13px] text-white/50 max-w-[200px]">
              Complete your first track to unlock certificates here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {certs.slice(0, 4).map((c) => {
              const t = getTrack(c.trackSlug);
              if (!t) return null;
              return (
                <Link 
                  key={c.id} 
                  href={`/cert/${c.id}`}
                  className="relative group/cert overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-white/[0.03] to-white/[0.01] hover:from-white/[0.08] hover:to-white/[0.03] transition-all aspect-[4/3] flex flex-col items-center justify-center p-3 text-center"
                >
                  <div 
                    className="absolute inset-0 opacity-0 group-hover/cert:opacity-100 transition-opacity duration-500 pointer-events-none mix-blend-overlay"
                    style={{ background: `linear-gradient(135deg, rgba(${t.color},0.4), transparent)` }}
                  />
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center text-[20px] mb-2 shadow-lg transition-transform group-hover/cert:scale-110 duration-300"
                    style={{ background: `linear-gradient(135deg, rgba(${t.color},0.2), rgba(${t.color},0.05))`, boxShadow: `0 4px 12px rgba(${t.color},0.2)` }}
                  >
                    {t.heroEmoji}
                  </div>
                  <div className="font-display font-bold text-[12px] text-white leading-tight line-clamp-2">
                    {t.title}
                  </div>
                  <div className="text-[9px] uppercase tracking-wider text-white/40 mt-1">
                    {new Date(c.issuedAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric'})}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Progress thermometer for next cert */}
      {inProgressCount > 0 && (
        <div className="mt-5 relative z-10">
          <div className="flex justify-between items-end mb-1.5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-white/40">Next unlock</div>
            <div className="text-[10px] font-bold text-amber-400">In Progress</div>
          </div>
          <div className="flex gap-1">
             {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="flex-1 h-1.5 rounded-full"
                  style={{
                    background: i < 3 ? "#fbbf24" : "rgba(255,255,255,0.1)",
                    boxShadow: i < 3 ? "0 0 8px rgba(251,191,36,0.4)" : "none",
                  }}
                />
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
