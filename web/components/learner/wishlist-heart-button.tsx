"use client";

import { useState } from "react";

export function WishlistHeartButton({
  trackSlug,
  initialSaved,
}: {
  trackSlug: string;
  initialSaved: boolean;
}) {
  const [saved, setSaved] = useState(initialSaved);
  const [busy, setBusy] = useState(false);

  async function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (busy) return;
    const next = !saved;
    setBusy(true);
    try {
      const res = next
        ? await fetch("/api/me/wishlist", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ trackSlug }),
          })
        : await fetch(`/api/me/wishlist?trackSlug=${encodeURIComponent(trackSlug)}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setSaved(next);
    } catch {
      setSaved(!next);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      className="inline-flex items-center justify-center rounded-lg border px-3 py-2 text-[13px] font-semibold transition-all hover:scale-[1.02] disabled:opacity-50"
      style={{
        borderColor: "rgba(37, 99, 235, 0.35)",
        background: saved ? "rgba(37, 99, 235, 0.12)" : "#fff",
        color: "#1e3a8a",
      }}
      title={saved ? "Remove from saved" : "Save for later"}
    >
      <span className="mr-1.5 text-[16px]">{saved ? "♥" : "♡"}</span>
      {saved ? "Saved" : "Save"}
    </button>
  );
}
