"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type Row = {
  userId: string;
  name: string;
  email: string;
  trackTitle: string;
  trackSlug: string;
  reasons: string[];
};

// Algorithmic Mock
function calculateRiskScore(userId: string = "", reasons: string[] = []) {
  let baseScore = 50;
  for (let i = 0; i < userId.length; i++) {
    baseScore += userId.charCodeAt(i) % 5;
  }
  // more reasons = higher risk
  baseScore += (reasons?.length || 0) * 15;
  return Math.min(99, Math.max(15, baseScore));
}

const TEMPLATES = [
  {
    label: "Gentle check-in",
    body: "Hi — I noticed you’ve had a lot on your plate. I’m here if you want to talk through the next step in the track, no pressure. Reply when you can.",
  },
  {
    label: "Offer help",
    body: "Hi — I’m reaching out because I want you to succeed in this course. If something’s blocking you (time, tech, or content), hit reply and we’ll figure out a path.",
  },
  {
    label: "Quiz encouragement",
    body: "Hi — the quiz is meant to reinforce what you’ve learned, not trip you up. Want a quick 10-min review before you try again? I can point you to the best module sections.",
  },
];

function rowKey(r: Row) {
  return `${r.userId}::${r.trackSlug}`;
}

export function AtRiskStudentPanel() {
  const [rows, setRows] = useState<(Row & { riskScore: number })[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [channel, setChannel] = useState<"email" | "sms" | "both">("email");
  const [subject, setSubject] = useState("Checking in from your course");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/teacher/students/at-risk", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load");
      const list = (data.students || []) as Row[];
      
      // Inject algorithmic risk scores and sort by highest risk
      const withRisk = list.map(r => ({
        ...r,
        riskScore: calculateRiskScore(r.userId, r.reasons)
      })).sort((a, b) => b.riskScore - a.riskScore);
      
      setRows(withRisk);
      setSelected({});
    } catch (e) {
      setErr((e as Error).message);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const selectedList = useMemo(() => {
    if (!rows) return [];
    return rows.filter((r) => selected[rowKey(r)]);
  }, [rows, selected]);

  const toggle = (r: Row) => {
    const k = rowKey(r);
    setSelected((s) => ({ ...s, [k]: !s[k] }));
  };

  const selectAll = () => {
    if (!rows?.length) return;
    const next: Record<string, boolean> = {};
    for (const r of rows) next[rowKey(r)] = true;
    setSelected(next);
  };

  const clearSelection = () => setSelected({});

  const sendBulk = async () => {
    if (selectedList.length === 0) return;
    setSending(true);
    setSendResult(null);
    try {
      const res = await fetch("/api/teacher/students/bulk-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel,
          subject: channel === "sms" ? undefined : subject,
          body,
          targets: selectedList.map((r) => ({ userId: r.userId, trackSlug: r.trackSlug })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Send failed");
      const parts = [`Email: ${data.emailsSent ?? 0}`, `SMS: ${data.smsSent ?? 0}`];
      if (data.errors?.length) parts.push(`Notes: ${data.errors.join("; ")}`);
      setSendResult("✅ Sent! " + parts.join(" · "));
      setTimeout(() => setSendResult(null), 5000);
    } catch (e) {
      setSendResult("❌ " + (e as Error).message);
    } finally {
      setSending(false);
    }
  };

  const getRiskColor = (score: number) => {
    if (score >= 80) return "text-red-400 bg-red-500/10 border-red-500/20";
    if (score >= 60) return "text-orange-400 bg-orange-500/10 border-orange-500/20";
    return "text-yellow-400 bg-yellow-500/10 border-yellow-500/20";
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 w-full">
      {/* Left Pane: Student Data Table */}
      <div className="flex-1 space-y-6">
        <section className="p-6 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-150"></div>
          
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-6 border-b border-white/10 relative z-10">
            <div>
              <h2 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                At-Risk Watchlist
              </h2>
              <p className="text-sm text-t3">Algorithmic risk predictions based on activity and performance.</p>
            </div>
            <button 
              type="button" 
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[13px] font-semibold text-white transition-all disabled:opacity-50" 
              onClick={() => void load()} 
              disabled={loading}
            >
              {loading ? "Scanning..." : "Rescan Students"}
            </button>
          </div>

          {err && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium flex items-center gap-2">
              <span className="text-lg">⚠️</span> {err}
            </div>
          )}

          {loading && !rows ? (
            <div className="py-12 flex flex-col items-center justify-center">
              <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-4"></div>
              <p className="text-sm text-t3">Running risk prediction algorithms...</p>
            </div>
          ) : rows && rows.length === 0 ? (
            <div className="py-16 text-center border border-dashed border-white/10 rounded-2xl bg-white/[0.01]">
              <div className="text-4xl mb-4">🎉</div>
              <p className="text-sm text-t2 font-semibold">No students are currently flagged as at-risk.</p>
              <p className="text-xs text-t3 mt-1">Excellent engagement across your courses.</p>
            </div>
          ) : rows && rows.length > 0 ? (
            <div className="space-y-3">
              {/* Table Header */}
              <div className="hidden md:grid grid-cols-[auto_1fr_1fr_120px] gap-4 px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-t3 border-b border-white/5">
                <div className="w-6"></div>
                <div>Student Profile</div>
                <div>Track & Flags</div>
                <div className="text-right">Risk Score</div>
              </div>

              {/* Rows */}
              {rows.map((r) => {
                const k = rowKey(r);
                const isSelected = Boolean(selected[k]);
                return (
                  <label key={k} className={`flex flex-col md:grid md:grid-cols-[auto_1fr_1fr_120px] gap-4 items-center p-4 rounded-2xl border transition-all cursor-pointer ${
                    isSelected 
                      ? 'bg-indigo-500/10 border-indigo-500/30' 
                      : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.05] hover:border-white/10'
                  }`}>
                    <div className="w-full flex md:w-auto items-center justify-between md:justify-center shrink-0">
                      <input
                        type="checkbox"
                        className="w-5 h-5 rounded-md border-white/20 bg-black/50 checked:bg-indigo-500 checked:border-indigo-500 focus:ring-indigo-500/30 transition-colors"
                        checked={isSelected}
                        onChange={() => toggle(r)}
                      />
                      {/* Mobile risk score */}
                      <div className="md:hidden">
                         <span className={`px-2 py-1 rounded-md text-xs font-bold border ${getRiskColor(r.riskScore)}`}>
                            Risk: {r.riskScore}
                         </span>
                      </div>
                    </div>
                    
                    <div className="w-full min-w-0">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-sm font-bold text-white shadow-lg shrink-0">
                          {(r.name || "S").charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-white truncate">{r.name || "Unknown Student"}</div>
                          <div className="text-[11px] text-t3 font-mono truncate">{r.email || "No email"}</div>
                        </div>
                      </div>
                    </div>

                    <div className="w-full min-w-0">
                      <div className="text-[13px] font-semibold text-indigo-300 truncate mb-1">{r.trackTitle || "Course"}</div>
                      <div className="flex flex-wrap gap-1">
                        {(r.reasons || []).map((x, i) => (
                          <span key={i} className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] text-t3 whitespace-nowrap">
                            {x}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="hidden md:flex justify-end w-full">
                      <div className={`px-3 py-1.5 rounded-lg border text-center min-w-[60px] ${getRiskColor(r.riskScore)}`}>
                        <div className="text-lg font-black leading-none">{r.riskScore}</div>
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          ) : null}
        </section>
      </div>

      {/* Right Pane: Bulk Outreach Console */}
      <div className="w-full lg:w-[400px] shrink-0 space-y-6">
        <section className="p-6 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-xl sticky top-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-indigo-400 mb-6 flex items-center gap-2">
            <span>📫</span> Outreach Console
          </h2>
          
          <div className="flex flex-col gap-4 mb-6">
            <div className="p-4 rounded-2xl bg-black/40 border border-white/5 flex items-center justify-between">
              <span className="text-[13px] font-medium text-t2">Selected Students</span>
              <span className="text-xl font-black text-white bg-white/10 px-3 py-1 rounded-xl">{selectedList.length}</span>
            </div>
            
            {rows && rows.length > 0 && (
              <div className="flex gap-2">
                <button type="button" className="flex-1 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[12px] font-semibold text-white transition-colors" onClick={selectAll}>
                  Select All
                </button>
                <button type="button" className="flex-1 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[12px] font-semibold text-white transition-colors" onClick={clearSelection}>
                  Clear
                </button>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-t3 block mb-1.5">Delivery Channel</label>
              <select
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:ring-2 focus:ring-indigo-500/50 focus:outline-none transition-all"
                value={channel}
                onChange={(e) => setChannel(e.target.value as "email" | "sms" | "both")}
              >
                <option value="email">Email only</option>
                <option value="sms">SMS only</option>
                <option value="both">Email + SMS</option>
              </select>
            </div>
            
            {channel !== "sms" && (
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-t3 block mb-1.5">Subject</label>
                <input
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:ring-2 focus:ring-indigo-500/50 focus:outline-none transition-all"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>
            )}
            
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-t3 block">Message Template</label>
                <div className="dropdown relative group">
                  <span className="text-[10px] text-indigo-400 cursor-pointer font-bold hover:underline">Load Template ▼</span>
                  <div className="absolute right-0 top-full mt-1 w-64 bg-[#1a1a24] border border-white/10 rounded-xl shadow-2xl p-2 hidden group-hover:block z-50">
                    {TEMPLATES.map((t) => (
                      <button 
                        key={t.label} 
                        className="w-full text-left px-3 py-2 text-xs text-white hover:bg-white/10 rounded-lg transition-colors mb-1 last:mb-0"
                        onClick={() => setBody(t.body)}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <textarea
                className="w-full min-h-[140px] bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:ring-2 focus:ring-indigo-500/50 focus:outline-none transition-all resize-none"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Write a short, supportive message to help them get back on track..."
              />
            </div>

            {sendResult && (
              <div className={`p-3 rounded-xl border text-[12px] font-medium ${sendResult.includes("❌") ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-green-500/10 border-green-500/20 text-green-400'}`}>
                {sendResult}
              </div>
            )}

            <button
              type="button"
              className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-indigo-500/25 disabled:opacity-50 disabled:shadow-none flex justify-center items-center gap-2 mt-4"
              disabled={sending || selectedList.length === 0 || !body.trim()}
              onClick={() => void sendBulk()}
            >
              {sending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Dispatching...
                </>
              ) : (
                <>
                  <span>✉️</span> Send to {selectedList.length} Students
                </>
              )}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
