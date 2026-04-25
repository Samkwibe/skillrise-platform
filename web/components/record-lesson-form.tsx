"use client";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { LIFE_CATEGORIES, type LifeCategory } from "@/lib/store";

const EMOJIS = ["⚡", "💻", "💰", "🔧", "🏥", "🎨", "🗣️", "🔌", "🎓", "🍳"];

// Content Quality Algorithm Mock
function evaluateQuality(title: string, desc: string, videoUrl: string, duration: string) {
  const checks = [
    { id: 'title', label: 'Catchy Title (5+ words)', passed: title.trim().split(/\s+/).length >= 5 },
    { id: 'desc', label: 'Detailed Description', passed: desc.length > 50 },
    { id: 'video', label: 'Valid Video Link attached', passed: videoUrl.includes('http') },
    { id: 'duration', label: 'Optimal Duration (< 5 min)', passed: parseInt(duration) < 5 || duration.includes('min') },
  ];
  
  const score = Math.round((checks.filter(c => c.passed).length / checks.length) * 100);
  return { checks, score };
}

export function RecordLessonForm({ tracks }: { tracks: { slug: string; title: string }[] }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [takeaway, setTakeaway] = useState("");
  const [category, setCategory] = useState<LifeCategory>("job-readiness");
  const [duration, setDuration] = useState("3 min");
  const [emoji, setEmoji] = useState("🎓");
  const [youth, setYouth] = useState(false);
  const [trackSlug, setTrackSlug] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const [quality, setQuality] = useState(evaluateQuality(title, description, videoUrl, duration));

  useEffect(() => {
    setQuality(evaluateQuality(title, description, videoUrl, duration));
  }, [title, description, videoUrl, duration]);

  return (
    <div className="flex flex-col xl:flex-row gap-8 w-full">
      {/* Left Pane: Creator Studio Form */}
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setErr("");
          const res = await fetch("/api/feed", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title,
              description,
              category,
              takeaway: takeaway.trim() || undefined,
              duration,
              emoji,
              youth,
              trackSlug: trackSlug || undefined,
              videoUrl: videoUrl.trim() || undefined,
            }),
          });
          setBusy(false);
          if (!res.ok) {
            const b = (await res.json().catch(() => ({}))) as { error?: string };
            setErr(b.error || "Could not publish.");
            return;
          }
          router.push("/feed");
          router.refresh();
        }}
        className="flex-1 max-w-3xl space-y-6"
      >
        <div className="p-6 md:p-8 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-xl relative">
          
          <div className="flex items-center justify-between mb-8 pb-6 border-b border-white/10">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span className="text-red-500 animate-pulse">●</span> Record & Upload
              </h2>
              <p className="text-sm text-t3 mt-1">Publish micro-lessons directly to the SkillFeed.</p>
            </div>
            <div className={`px-4 py-2 rounded-xl border flex items-center gap-2 font-bold ${quality.score === 100 ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400'}`}>
              Quality Score: {quality.score}%
            </div>
          </div>

          <div className="space-y-5">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-t3 block mb-1.5" htmlFor="rl-title">Lesson Title</label>
              <input id="rl-title" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:ring-2 focus:ring-indigo-500/50 focus:outline-none transition-all placeholder:text-t3/50" placeholder="e.g. 3 Tips for React Performance" required value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-t3 block mb-1.5" htmlFor="rl-video">Video Link (YouTube, Vimeo, MP4)</label>
              <input
                id="rl-video"
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:ring-2 focus:ring-indigo-500/50 focus:outline-none transition-all placeholder:text-t3/50 font-mono"
                type="url"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-t3 block mb-1.5" htmlFor="rl-desc">Description</label>
              <textarea id="rl-desc" className="w-full min-h-[100px] bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:ring-2 focus:ring-indigo-500/50 focus:outline-none transition-all resize-none placeholder:text-t3/50" placeholder="What will they learn?" required value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-t3 block mb-1.5" htmlFor="rl-takeaway">Key Takeaway <span className="text-t3/50 normal-case font-normal">(Optional)</span></label>
              <input
                id="rl-takeaway"
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:ring-2 focus:ring-indigo-500/50 focus:outline-none transition-all placeholder:text-t3/50"
                value={takeaway}
                onChange={(e) => setTakeaway(e.target.value)}
                placeholder="The one thing to remember..."
                maxLength={500}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-t3 block mb-1.5" htmlFor="rl-cat">Category</label>
                <select
                  id="rl-cat"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:ring-2 focus:ring-indigo-500/50 focus:outline-none transition-all"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as LifeCategory)}
                >
                  {LIFE_CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.emoji} {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-t3 block mb-1.5" htmlFor="rl-track">Link to Course <span className="text-t3/50 normal-case font-normal">(Optional)</span></label>
                <select id="rl-track" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:ring-2 focus:ring-indigo-500/50 focus:outline-none transition-all" value={trackSlug} onChange={(e) => setTrackSlug(e.target.value)}>
                  <option value="">None (Standalone post)</option>
                  {tracks.map((t) => <option key={t.slug} value={t.slug}>{t.title}</option>)}
                </select>
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-t3 block mb-1.5" htmlFor="rl-duration">Duration</label>
                  <input id="rl-duration" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:ring-2 focus:ring-indigo-500/50 focus:outline-none transition-all" value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="e.g. 5 min" />
                </div>
                <div className="w-24">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-t3 block mb-1.5" htmlFor="rl-emoji">Icon</label>
                  <select id="rl-emoji" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-lg focus:ring-2 focus:ring-indigo-500/50 focus:outline-none transition-all text-center" value={emoji} onChange={(e) => setEmoji(e.target.value)}>
                    {EMOJIS.map((x) => <option key={x} value={x}>{x}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 mt-6">
              <label className="flex items-center gap-3 p-4 rounded-xl border border-white/5 bg-white/[0.02] cursor-pointer hover:bg-white/[0.05] transition-colors">
                <input type="checkbox" className="w-5 h-5 rounded-md border-white/20 bg-black/50 checked:bg-indigo-500 checked:border-indigo-500 focus:ring-indigo-500/30 transition-colors" checked={youth} onChange={(e) => setYouth(e.target.checked)} />
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-white">Safe for Youth Zone</span>
                  <span className="text-[11px] text-t3">Flag this content as appropriate for learners ages 13–18.</span>
                </div>
              </label>
            </div>

            {err && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium flex items-center gap-2">
                <span className="text-lg">⚠️</span> {err}
              </div>
            )}
          </div>

          <div className="mt-8">
            <button 
              disabled={busy || quality.score < 50} 
              className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-indigo-500/25 disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2" 
              type="submit"
            >
              {busy ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Publishing...</>
              ) : (
                <><span>🚀</span> Publish to SkillFeed</>
              )}
            </button>
            {quality.score < 50 && <p className="text-xs text-center text-red-400 mt-2">Quality score must be at least 50% to publish.</p>}
          </div>
        </div>
      </form>

      {/* Right Pane: Content Quality Checklist */}
      <div className="w-full xl:w-[380px] shrink-0 space-y-6">
        <section className="p-6 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-xl sticky top-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-t3 mb-6 flex items-center gap-2">
            <span>✨</span> Algorithmic Quality Check
          </h2>
          
          <div className="relative mb-8 flex justify-center">
             <div className="w-32 h-32 rounded-full border-4 border-white/5 flex items-center justify-center relative">
               <svg className="absolute inset-0 w-full h-full -rotate-90">
                 <circle cx="60" cy="60" r="58" fill="none" stroke="currentColor" strokeWidth="4" className="text-white/5" />
                 <circle 
                  cx="60" cy="60" r="58" fill="none" stroke="currentColor" strokeWidth="4" 
                  strokeDasharray="364" 
                  strokeDashoffset={364 - (364 * quality.score) / 100} 
                  className={`transition-all duration-1000 ${quality.score === 100 ? 'text-green-500' : 'text-indigo-500'}`} 
                />
               </svg>
               <div className="flex flex-col items-center">
                 <span className="text-3xl font-black text-white">{quality.score}</span>
                 <span className="text-[10px] text-t3 uppercase tracking-widest">Score</span>
               </div>
             </div>
          </div>

          <div className="space-y-3">
            {quality.checks.map((check) => (
              <div key={check.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${check.passed ? 'bg-green-500/5 border-green-500/20' : 'bg-white/5 border-white/10'}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${check.passed ? 'bg-green-500/20 text-green-400' : 'bg-white/10 text-t3'}`}>
                  {check.passed ? '✓' : '—'}
                </div>
                <span className={`text-sm ${check.passed ? 'text-green-100 font-medium' : 'text-t3'}`}>{check.label}</span>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
            <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-wider mb-2">Pro Tip</h4>
            <p className="text-xs text-indigo-100/70 leading-relaxed">Videos under 5 minutes with clear takeaways have a 78% higher completion rate in the SkillFeed.</p>
          </div>
        </section>
      </div>
    </div>
  );
}
