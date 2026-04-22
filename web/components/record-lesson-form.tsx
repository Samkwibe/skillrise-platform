"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

const EMOJIS = ["⚡", "💻", "💰", "🔧", "🏥", "🎨", "🗣️", "🔌", "🎓", "🍳"];

export function RecordLessonForm({ tracks }: { tracks: { slug: string; title: string }[] }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState("3 min");
  const [emoji, setEmoji] = useState("🎓");
  const [youth, setYouth] = useState(false);
  const [trackSlug, setTrackSlug] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setErr("");
        const res = await fetch("/api/feed", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, description, duration, emoji, youth, trackSlug }),
        });
        setBusy(false);
        if (!res.ok) {
          const b = await res.json().catch(() => ({}));
          setErr(b.error || "Could not publish.");
          return;
        }
        router.push("/feed");
        router.refresh();
      }}
      className="flex flex-col gap-4 card p-6"
    >
      <div className="aspect-video rounded-[10px] border border-dashed border-border2 flex flex-col items-center justify-center text-t3 text-[13px]">
        <div className="text-[40px]">🎥</div>
        Drop video here (demo — we&apos;ll wire Cloudflare Stream in prod)
      </div>
      <div>
        <label className="label" htmlFor="title">Lesson title</label>
        <input id="title" className="input" required value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div>
        <label className="label" htmlFor="desc">One-line description</label>
        <textarea id="desc" className="input" rows={3} required value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
      <div className="grid sm:grid-cols-3 gap-3">
        <div>
          <label className="label" htmlFor="duration">Duration</label>
          <input id="duration" className="input" value={duration} onChange={(e) => setDuration(e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="emoji">Thumbnail</label>
          <select id="emoji" className="input" value={emoji} onChange={(e) => setEmoji(e.target.value)}>
            {EMOJIS.map((e) => <option key={e}>{e}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="track">Track</label>
          <select id="track" className="input" value={trackSlug} onChange={(e) => setTrackSlug(e.target.value)}>
            <option value="">None</option>
            {tracks.map((t) => <option key={t.slug} value={t.slug}>{t.title}</option>)}
          </select>
        </div>
      </div>
      <label className="flex items-center gap-2 text-[13px] text-t2 cursor-pointer">
        <input type="checkbox" checked={youth} onChange={(e) => setYouth(e.target.checked)} />
        Safe for the Youth Zone (13–18)
      </label>
      {err && <div className="pill pill-red">{err}</div>}
      <button disabled={busy} className="btn btn-primary btn-xl justify-center">{busy ? "Publishing…" : "Publish to SkillFeed"}</button>
    </form>
  );
}
