"use client";

import { useCallback, useEffect, useState } from "react";

type S = { token: string; current: boolean; createdAt: number; userAgent?: string; ip?: string };

export function SessionSecurity() {
  const [sessions, setSessions] = useState<S[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setErr(null);
    try {
      const res = await fetch("/api/auth/sessions");
      if (!res.ok) {
        setErr("Could not load sessions.");
        return;
      }
      const data = (await res.json()) as { sessions: S[] };
      setSessions(data.sessions);
    } catch {
      setErr("Network error.");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function revokeOthers() {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/auth/sessions", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
      if (!res.ok) {
        const d = (await res.json()) as { error?: string };
        setErr(d.error || "Request failed");
        setBusy(false);
        return;
      }
      await load();
    } catch {
      setErr("Network error");
    }
    setBusy(false);
  }

  if (err && !sessions) {
    return <p className="text-sm text-red-400">{err}</p>;
  }
  if (!sessions) {
    return <p className="text-sm text-t3">Loading sessions…</p>;
  }

  const others = sessions.filter((s) => !s.current).length;

  return (
    <div className="text-[13px] text-t2 space-y-2">
      <p>
        <span className="text-t1 font-medium">{sessions.length}</span> active session
        {sessions.length === 1 ? "" : "s"}
        {others > 0 && ` (${others} on other devices)`}.
      </p>
      {others > 0 && (
        <button
          type="button"
          disabled={busy}
          onClick={revokeOthers}
          className="text-sm font-semibold text-g underline disabled:opacity-50"
        >
          {busy ? "Signing out…" : "Sign out other devices"}
        </button>
      )}
      {err && <p className="text-red-400">{err}</p>}
    </div>
  );
}
