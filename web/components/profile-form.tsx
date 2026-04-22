"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function ProfileForm({ initial }: { initial: { name: string; neighborhood: string; bio: string; credentials: string } }) {
  const router = useRouter();
  const [name, setName] = useState(initial.name);
  const [neighborhood, setNeighborhood] = useState(initial.neighborhood);
  const [bio, setBio] = useState(initial.bio);
  const [credentials, setCredentials] = useState(initial.credentials);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setMsg("");
        const res = await fetch("/api/me", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, neighborhood, bio, credentials }),
        });
        setBusy(false);
        if (res.ok) {
          setMsg("Saved.");
          router.refresh();
        } else {
          const b = await res.json().catch(() => ({}));
          setMsg(b.error || "Could not save.");
        }
      }}
      className="card p-6 flex flex-col gap-4"
    >
      <div>
        <label className="label" htmlFor="name">Full name</label>
        <input id="name" className="input" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div>
        <label className="label" htmlFor="neighborhood">Neighborhood</label>
        <input id="neighborhood" className="input" value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} />
      </div>
      <div>
        <label className="label" htmlFor="bio">Bio</label>
        <textarea id="bio" className="input" rows={3} value={bio} onChange={(e) => setBio(e.target.value)} />
      </div>
      <div>
        <label className="label" htmlFor="credentials">Credentials (visible on lessons & profile)</label>
        <input id="credentials" className="input" value={credentials} onChange={(e) => setCredentials(e.target.value)} />
      </div>
      {msg && <div className="pill">{msg}</div>}
      <button disabled={busy} className="btn btn-primary justify-center self-start">{busy ? "Saving…" : "Save changes"}</button>
    </form>
  );
}
