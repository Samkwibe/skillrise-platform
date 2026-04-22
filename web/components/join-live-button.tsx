"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function JoinLiveButton({ id, joined }: { id: string; joined: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [state, setState] = useState(joined);
  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        const res = await fetch(`/api/live/${id}/rsvp`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ join: !state }) });
        setBusy(false);
        if (res.ok) {
          setState(!state);
          router.refresh();
        }
      }}
      className={`btn w-full justify-center btn-sm ${state ? "btn-ghost" : "btn-primary"}`}
    >
      {state ? "✓ You're in — add to calendar" : busy ? "Saving…" : "Reserve a seat"}
    </button>
  );
}
