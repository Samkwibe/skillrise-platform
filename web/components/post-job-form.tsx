"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function PostJobForm({ tracks }: { tracks: { slug: string; title: string }[] }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [wageFrom, setWageFrom] = useState("");
  const [wageTo, setWageTo] = useState("");
  const [wageUnit, setWageUnit] = useState<"hr" | "yr">("hr");
  const [type, setType] = useState("Full time");
  const [requiredTrackSlug, setRequiredTrackSlug] = useState("");
  const [hireGuarantee, setHireGuarantee] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setErr("");
        const res = await fetch("/api/jobs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, description, wageFrom, wageTo, wageUnit, type, requiredTrackSlug, hireGuarantee }),
        });
        const body = await res.json();
        setBusy(false);
        if (!res.ok) {
          setErr(body.error || "Could not post.");
          return;
        }
        router.push("/employers/dashboard");
        router.refresh();
      }}
      className="flex flex-col gap-4 card p-6"
    >
      <div>
        <label className="label" htmlFor="title">Role title</label>
        <input id="title" className="input" required value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div>
        <label className="label" htmlFor="desc">Role description</label>
        <textarea id="desc" className="input" rows={5} required value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
      <div className="grid sm:grid-cols-3 gap-3">
        <div>
          <label className="label" htmlFor="wageFrom">Wage from</label>
          <input id="wageFrom" type="number" min={0} className="input" value={wageFrom} onChange={(e) => setWageFrom(e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="wageTo">Wage to</label>
          <input id="wageTo" type="number" min={0} className="input" value={wageTo} onChange={(e) => setWageTo(e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="wageUnit">Unit</label>
          <select id="wageUnit" className="input" value={wageUnit} onChange={(e) => setWageUnit(e.target.value as "hr" | "yr")}>
            <option value="hr">/hr</option>
            <option value="yr">/yr</option>
          </select>
        </div>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="label" htmlFor="type">Type</label>
          <select id="type" className="input" value={type} onChange={(e) => setType(e.target.value)}>
            <option>Full time</option>
            <option>Part time</option>
            <option>Apprentice</option>
          </select>
        </div>
        <div>
          <label className="label" htmlFor="track">Required certificate</label>
          <select id="track" className="input" value={requiredTrackSlug} onChange={(e) => setRequiredTrackSlug(e.target.value)}>
            <option value="">Any / none required</option>
            {tracks.map((t) => <option key={t.slug} value={t.slug}>{t.title}</option>)}
          </select>
        </div>
      </div>
      <label className="flex items-center gap-2 text-[13px] text-t2 cursor-pointer">
        <input type="checkbox" checked={hireGuarantee} onChange={(e) => setHireGuarantee(e.target.checked)} />
        Enroll this role in the 90-day hire-guarantee program
      </label>
      {err && <div className="pill pill-red">{err}</div>}
      <button disabled={busy} className="btn btn-primary btn-xl justify-center">{busy ? "Posting…" : "Publish role"}</button>
    </form>
  );
}
