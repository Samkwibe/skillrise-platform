"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

export function LearnerAIWidget() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    router.push(`/assistant?q=${encodeURIComponent(query)}`);
  };

  return (
    <div className="p-5 rounded-2xl bg-white/[0.02] border border-indigo-500/20 backdrop-blur-xl relative overflow-hidden group hover:border-indigo-500/40 transition-colors shadow-[0_0_15px_rgba(79,70,229,0.05)]">
      <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none group-hover:bg-indigo-500/20 transition-colors animate-pulse" style={{ animationDuration: '4s' }}></div>
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl -ml-10 -mb-10 pointer-events-none group-hover:bg-purple-500/20 transition-colors"></div>
      
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a8 8 0 0 0-8 8c0 5.4 3.6 8 8 12 4.4-4 8-6.6 8-12a8 8 0 0 0-8-8z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-indigo-400 mb-0.5">
              ◆ AI Tutor
            </div>
            <div className="font-display font-extrabold text-white text-[18px] leading-tight">
              Stuck? Just ask.
            </div>
          </div>
        </div>

        <p className="text-[13px] text-white/60 mb-4 leading-relaxed">
          I'm trained on your current tracks. Ask me to explain a concept, quiz you, or debug an issue.
        </p>

        <form onSubmit={handleSubmit} className="relative group/input">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl blur opacity-20 group-hover/input:opacity-40 transition-opacity"></div>
          <div className="relative flex items-center bg-black/40 border border-white/10 rounded-xl p-1 focus-within:border-indigo-500/50 focus-within:bg-black/60 transition-colors">
            <input
              type="text"
              placeholder="Explain loops to me..."
              className="flex-1 bg-transparent border-none text-[13px] text-white placeholder-white/40 px-3 py-2 outline-none focus:ring-0"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button
              type="submit"
              className="w-8 h-8 rounded-lg bg-indigo-500 hover:bg-indigo-400 text-white flex items-center justify-center transition-colors shadow-md shrink-0"
              disabled={!query.trim()}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </button>
          </div>
        </form>

        <div className="mt-4 flex flex-wrap gap-2">
          {["Quiz me", "Summarize last lesson", "Give me a challenge"].map((prompt, i) => (
            <button
              key={i}
              onClick={() => router.push(`/assistant?q=${encodeURIComponent(prompt)}`)}
              className="text-[10.5px] font-medium text-white/50 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 hover:text-white px-2.5 py-1 rounded-md transition-all"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
