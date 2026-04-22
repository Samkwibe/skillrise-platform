"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function ScheduleLiveForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [topic, setTopic] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [durationMin, setDurationMin] = useState(45);
  const [youth, setYouth] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  return (
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
      className="flex flex-col gap-4 card p-6"
    >
      <div>
        <label className="label" htmlFor="title">Session title</label>
        <input id="title" className="input" required value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div>
        <label className="label" htmlFor="topic">Topic</label>
        <input id="topic" className="input" required value={topic} onChange={(e) => setTopic(e.target.value)} />
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="label" htmlFor="startsAt">Starts</label>
          <input id="startsAt" type="datetime-local" className="input" required value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="duration">Duration (min)</label>
          <input id="duration" type="number" min={15} max={180} className="input" value={durationMin} onChange={(e) => setDurationMin(Number(e.target.value))} />
        </div>
      </div>
      <label className="flex items-center gap-2 text-[13px] text-t2 cursor-pointer">
        <input type="checkbox" checked={youth} onChange={(e) => setYouth(e.target.checked)} />
        Safe for the Youth Zone (13–18)
      </label>
      {err && <div className="pill pill-red">{err}</div>}
      <button disabled={busy} className="btn btn-primary btn-xl justify-center">{busy ? "Scheduling…" : "Schedule session"}</button>
    </form>
  );
}
