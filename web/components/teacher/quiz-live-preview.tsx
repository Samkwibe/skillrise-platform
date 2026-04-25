"use client";

import React, { useState } from "react";

type QDraft = { prompt: string; o0: string; o1: string; o2: string; o3: string; correctIndex: number };

interface QuizLivePreviewProps {
  title: string;
  kind: "checkpoint" | "final";
  youtubeVideoId: string;
  triggerAtSec: number;
  drafts: QDraft[];
}

export function QuizLivePreview({ title, kind, youtubeVideoId, triggerAtSec, drafts }: QuizLivePreviewProps) {
  const [currentQ, setCurrentQ] = useState(0);
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null);

  const activeDraft = drafts[currentQ] || drafts[0];
  const options = [activeDraft?.o0, activeDraft?.o1, activeDraft?.o2, activeDraft?.o3].filter(Boolean);

  // Helper to format seconds as MM:SS
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0a0f] rounded-2xl border border-white/10 overflow-hidden shadow-2xl relative">
      {/* Top Browser/App Bar Simulation */}
      <div className="h-10 bg-white/[0.03] border-b border-white/10 flex items-center px-4 gap-2">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50"></div>
          <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50"></div>
        </div>
        <div className="mx-auto flex items-center gap-2 bg-white/5 px-3 py-1 rounded-md text-[10px] font-mono text-t3 border border-white/5">
          <span>🔒</span> skillrise.com/learn
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-0 flex flex-col">
        {/* Fake Video Player area (for checkpoints) */}
        {kind === "checkpoint" && (
          <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
            {youtubeVideoId ? (
              <div className="absolute inset-0 opacity-40 bg-gradient-to-br from-indigo-900/50 to-purple-900/50 flex items-center justify-center">
                <span className="text-4xl">▶️</span>
              </div>
            ) : (
              <div className="text-t3 text-xs italic">Video preview</div>
            )}
            
            {/* The Quiz Overlay itself */}
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-10 flex flex-col p-6 animate-in fade-in duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-indigo-500/20 text-indigo-300 text-[10px] font-bold uppercase tracking-wider border border-indigo-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"></span>
                  Checkpoint • {formatTime(triggerAtSec)}
                </div>
                <div className="text-xs text-t3 font-medium bg-white/10 px-2 py-1 rounded-md">
                  {currentQ + 1} / {drafts.length}
                </div>
              </div>

              <div className="flex-1 flex flex-col justify-center max-w-lg mx-auto w-full">
                <h3 className="text-xl md:text-2xl font-bold text-white mb-6 leading-snug">
                  {activeDraft?.prompt || "Enter a question prompt..."}
                </h3>
                
                <div className="space-y-3">
                  {options.length > 0 ? options.map((opt, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedOpt(i)}
                      className={`w-full text-left p-4 rounded-xl border text-sm transition-all flex items-center gap-3 ${
                        selectedOpt === i 
                          ? 'bg-indigo-500/20 border-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.2)]' 
                          : 'bg-white/[0.03] border-white/10 text-t2 hover:bg-white/[0.08] hover:border-white/20'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                        selectedOpt === i ? 'border-indigo-400 bg-indigo-500' : 'border-t3'
                      }`}>
                        {selectedOpt === i && <div className="w-2 h-2 rounded-full bg-white"></div>}
                      </div>
                      {opt}
                    </button>
                  )) : (
                    <div className="text-t3 text-sm italic py-4">Add options to see them here.</div>
                  )}
                </div>

                <div className="mt-8 flex justify-end">
                  <button 
                    disabled={selectedOpt === null}
                    className="px-6 py-2.5 bg-white text-black text-sm font-bold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/90 transition-colors"
                  >
                    Submit Answer
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Full Page View (for final exams) */}
        {kind === "final" && (
          <div className="flex-1 p-8 flex flex-col max-w-2xl mx-auto w-full">
            <div className="text-center mb-10">
              <div className="inline-block px-3 py-1 bg-purple-500/20 text-purple-300 text-[11px] font-bold uppercase tracking-wider rounded-full mb-4">
                Final Exam
              </div>
              <h2 className="text-3xl font-extrabold text-white">{title || "Untitled Exam"}</h2>
            </div>

            <div className="bg-white/[0.03] border border-white/10 p-6 rounded-2xl flex-1 flex flex-col">
               <div className="flex justify-between text-xs text-t3 font-medium mb-6">
                 <span>Question {currentQ + 1} of {drafts.length}</span>
                 <span>Time limit: None</span>
               </div>
               
               <h3 className="text-lg font-bold text-white mb-6">
                  {activeDraft?.prompt || "Enter a question prompt..."}
                </h3>
                
                <div className="space-y-3">
                  {options.length > 0 ? options.map((opt, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedOpt(i)}
                      className={`w-full text-left p-4 rounded-xl border text-sm transition-all flex items-center gap-3 ${
                        selectedOpt === i 
                          ? 'bg-purple-500/20 border-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.2)]' 
                          : 'bg-white/[0.02] border-white/10 text-t2 hover:bg-white/[0.05] hover:border-white/20'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 ${
                        selectedOpt === i ? 'border-purple-400 bg-purple-500' : 'border-t3'
                      }`}>
                        {selectedOpt === i && <span className="text-[10px] text-white">✓</span>}
                      </div>
                      {opt}
                    </button>
                  )) : (
                    <div className="text-t3 text-sm italic py-4">Add options to see them here.</div>
                  )}
                </div>

                <div className="mt-auto pt-8 flex justify-between items-center">
                  <div className="flex gap-2">
                    {drafts.map((_, i) => (
                      <div key={i} className={`w-2 h-2 rounded-full ${i === currentQ ? 'bg-purple-400' : 'bg-white/10'}`}></div>
                    ))}
                  </div>
                  <button 
                    disabled={selectedOpt === null}
                    className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm font-bold rounded-lg disabled:opacity-50 hover:from-purple-500 hover:to-indigo-500 transition-colors shadow-lg shadow-purple-500/25"
                  >
                    Next Question
                  </button>
                </div>
            </div>
          </div>
        )}
      </div>

      {/* Editor Controls Overlay */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-md border border-white/10 rounded-full px-4 py-2 flex items-center gap-4 shadow-2xl">
        <button 
          onClick={() => { setCurrentQ(Math.max(0, currentQ - 1)); setSelectedOpt(null); }}
          disabled={currentQ === 0}
          className="text-xs text-white hover:text-indigo-400 disabled:opacity-30 disabled:hover:text-white"
        >
          ← Prev
        </button>
        <span className="text-[10px] text-t3 font-mono">Q{currentQ + 1}</span>
        <button 
          onClick={() => { setCurrentQ(Math.min(drafts.length - 1, currentQ + 1)); setSelectedOpt(null); }}
          disabled={currentQ === drafts.length - 1}
          className="text-xs text-white hover:text-indigo-400 disabled:opacity-30 disabled:hover:text-white"
        >
          Next →
        </button>
      </div>
    </div>
  );
}
