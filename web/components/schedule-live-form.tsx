"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

// Mock Optimal Scheduling Algorithm
// In production, this would query the DB for the teacher's students and find overlapping free blocks
const SUGGESTED_TIMES = [
  { day: "Today", time: "18:00", label: "High Attendance", score: 98, offsetHours: 6 },
  { day: "Tomorrow", time: "19:30", label: "Good Attendance", score: 85, offsetHours: 25.5 },
  { day: "Saturday", time: "10:00", label: "Weekend Peak", score: 92, offsetHours: 72 },
];

export function ScheduleLiveForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [topic, setTopic] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [durationMin, setDurationMin] = useState(45);
  const [youth, setYouth] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const applySuggestedTime = (offsetHours: number) => {
    const d = new Date();
    d.setHours(d.getHours() + offsetHours);
    d.setMinutes(0);
    d.setSeconds(0);
    d.setMilliseconds(0);
    
    // Format to YYYY-MM-DDThh:mm
    const pad = (n: number) => n.toString().padStart(2, '0');
    const formatted = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    setStartsAt(formatted);
  };

  return (
    <div className="flex flex-col xl:flex-row gap-8 w-full">
      {/* Left Pane: Schedule Form */}
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setErr("");
          const res = await fetch("/api/live", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title, topic, startsAt, durationMin, youth }),
          });
          setBusy(false);
          if (!res.ok) {
            const b = await res.json().catch(() => ({}));
            setErr(b.error || "Could not schedule.");
            return;
          }
          router.refresh();
          setTitle("");
          setTopic("");
          setStartsAt("");
        }}
        className="flex-1 space-y-6 max-w-3xl"
      >
        <div className="p-6 md:p-8 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-xl">
          <div className="flex items-center gap-3 mb-8 pb-6 border-b border-white/10">
            <div className="w-10 h-10 rounded-full bg-indigo-500/20 border border-indigo-500/50 flex items-center justify-center text-xl">
              🎙️
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Broadcast Details</h2>
              <p className="text-sm text-t3">Fill in the info for your next live session.</p>
            </div>
          </div>

          <div className="space-y-5">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-t3 block mb-1.5" htmlFor="title">Session Title</label>
              <input id="title" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:ring-2 focus:ring-indigo-500/50 focus:outline-none transition-all placeholder:text-t3/50" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Q&A: React Server Components" />
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-t3 block mb-1.5" htmlFor="topic">Main Topic</label>
              <input id="topic" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:ring-2 focus:ring-indigo-500/50 focus:outline-none transition-all placeholder:text-t3/50" required value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. Frontend Development" />
            </div>

            <div className="grid sm:grid-cols-2 gap-5 pt-2">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-t3 block mb-1.5" htmlFor="startsAt">Start Time</label>
                <input id="startsAt" type="datetime-local" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:ring-2 focus:ring-indigo-500/50 focus:outline-none transition-all" required value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
              </div>
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-t3 block mb-1.5" htmlFor="duration">Duration (Minutes)</label>
                <input id="duration" type="number" min={15} max={180} step={15} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:ring-2 focus:ring-indigo-500/50 focus:outline-none transition-all" value={durationMin} onChange={(e) => setDurationMin(Number(e.target.value))} />
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

          <button 
            disabled={busy} 
            className="w-full mt-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-indigo-500/25 disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2" 
            type="submit"
          >
            {busy ? (
              <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Scheduling...</>
            ) : (
              <><span>📡</span> Schedule Broadcast</>
            )}
          </button>
        </div>
      </form>

      {/* Right Pane: AI Optimal Scheduling */}
      <div className="w-full xl:w-[350px] shrink-0 space-y-6">
        <section className="p-6 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-xl sticky top-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-indigo-400 mb-2 flex items-center gap-2">
            <span>🧠</span> Optimal Scheduling
          </h2>
          <p className="text-[13px] text-t3 mb-6">Algorithmically suggested times based on when your students are most active on the platform.</p>
          
          <div className="space-y-3">
            {SUGGESTED_TIMES.map((time, i) => (
              <button
                key={i}
                onClick={() => applySuggestedTime(time.offsetHours)}
                type="button"
                className="w-full text-left flex items-center justify-between p-4 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-indigo-500/10 hover:border-indigo-500/30 transition-all group"
              >
                <div>
                  <div className="font-bold text-white group-hover:text-indigo-300 transition-colors mb-0.5">{time.day} @ {time.time}</div>
                  <div className="text-[11px] text-t3">{time.label}</div>
                </div>
                <div className="flex flex-col items-end">
                  <div className={`text-lg font-black ${time.score > 90 ? 'text-green-400' : 'text-blue-400'}`}>{time.score}</div>
                  <div className="text-[9px] uppercase tracking-widest text-t3">Score</div>
                </div>
              </button>
            ))}
          </div>

          <div className="mt-6 p-4 rounded-xl bg-white/5 border border-white/10">
            <h4 className="text-[11px] font-bold text-t3 uppercase tracking-wider mb-2">How this works</h4>
            <p className="text-xs text-t2 leading-relaxed">
              We cross-reference the <strong className="text-white">Engagement Heatmap</strong> with your students' local timezones to find overlapping free blocks with the highest probability of attendance.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
