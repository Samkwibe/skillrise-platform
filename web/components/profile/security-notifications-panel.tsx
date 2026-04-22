"use client";

import { useCallback, useEffect, useState } from "react";
import type { SecurityNotification } from "@/lib/store";

function formatWhen(at: number) {
  try {
    return new Date(at).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return "";
  }
}

export function SecurityNotificationsPanel() {
  const [rows, setRows] = useState<SecurityNotification[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setErr(null);
    try {
      const res = await fetch("/api/me/security");
      if (!res.ok) {
        setErr("Could not load security activity.");
        return;
      }
      const data = (await res.json()) as { notifications: SecurityNotification[] };
      setRows(data.notifications);
    } catch {
      setErr("Network error.");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function markAllRead() {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/me/security", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllRead: true }),
      });
      if (!res.ok) {
        const d = (await res.json()) as { error?: string };
        setErr(d.error || "Request failed");
        return;
      }
      const data = (await res.json()) as { notifications: SecurityNotification[] };
      setRows(data.notifications);
    } catch {
      setErr("Network error.");
    }
    setBusy(false);
  }

  if (err && !rows) {
    return <p className="text-sm text-red-400">{err}</p>;
  }
  if (!rows) {
    return <p className="text-sm text-t3">Loading activity…</p>;
  }

  const unread = rows.filter((n) => !n.read).length;

  if (rows.length === 0) {
    return (
      <p className="text-[13px] text-t2">
        No security alerts yet. When we record important account events, they will appear here.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {unread > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[12px] text-t3">
            {unread} unread notification{unread === 1 ? "" : "s"}
          </p>
          <button
            type="button"
            className="text-sm font-semibold text-g underline disabled:opacity-50"
            disabled={busy}
            onClick={() => void markAllRead()}
          >
            {busy ? "Updating…" : "Mark all read"}
          </button>
        </div>
      )}
      <ul className="space-y-2">
        {rows.map((n) => (
          <li
            key={n.id}
            className="rounded-lg border p-3 text-[13px]"
            style={{
              borderColor: "var(--border-1)",
              background: n.read ? "transparent" : "var(--surface-2)",
            }}
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <span className="font-semibold text-t1">{n.title}</span>
              <span className="text-[11px] text-t3 shrink-0">{formatWhen(n.at)}</span>
            </div>
            {n.detail && <p className="text-t2 mt-1">{n.detail}</p>}
            {!n.read && (
              <p className="text-[11px] uppercase tracking-wide text-g mt-2" aria-label="Unread">
                New
              </p>
            )}
          </li>
        ))}
      </ul>
      {err && <p className="text-sm text-red-400">{err}</p>}
    </div>
  );
}
