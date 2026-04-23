"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type Row = {
  userId: string;
  name: string;
  email: string;
  trackTitle: string;
  trackSlug: string;
  reasons: string[];
};

const TEMPLATES = [
  {
    label: "Gentle check-in",
    body: "Hi — I noticed you’ve had a lot on your plate. I’m here if you want to talk through the next step in the track, no pressure. Reply when you can.",
  },
  {
    label: "Offer help",
    body: "Hi — I’m reaching out because I want you to succeed in this course. If something’s blocking you (time, tech, or content), hit reply and we’ll figure out a path.",
  },
  {
    label: "Quiz encouragement",
    body: "Hi — the quiz is meant to reinforce what you’ve learned, not trip you up. Want a quick 10-min review before you try again? I can point you to the best module sections.",
  },
];

function rowKey(r: Row) {
  return `${r.userId}::${r.trackSlug}`;
}

export function AtRiskStudentPanel() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [channel, setChannel] = useState<"email" | "sms" | "both">("email");
  const [subject, setSubject] = useState("Checking in from your course");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/teacher/students/at-risk", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load");
      const list = (data.students || []) as Row[];
      setRows(list);
      setSelected({});
    } catch (e) {
      setErr((e as Error).message);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const selectedList = useMemo(() => {
    if (!rows) return [];
    return rows.filter((r) => selected[rowKey(r)]);
  }, [rows, selected]);

  const toggle = (r: Row) => {
    const k = rowKey(r);
    setSelected((s) => ({ ...s, [k]: !s[k] }));
  };

  const selectAll = () => {
    if (!rows?.length) return;
    const next: Record<string, boolean> = {};
    for (const r of rows) next[rowKey(r)] = true;
    setSelected(next);
  };

  const clearSelection = () => setSelected({});

  const sendBulk = async () => {
    if (selectedList.length === 0) return;
    setSending(true);
    setSendResult(null);
    try {
      const res = await fetch("/api/teacher/students/bulk-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel,
          subject: channel === "sms" ? undefined : subject,
          body,
          targets: selectedList.map((r) => ({ userId: r.userId, trackSlug: r.trackSlug })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Send failed");
      const parts = [`Email: ${data.emailsSent ?? 0}`, `SMS: ${data.smsSent ?? 0}`];
      if (data.errors?.length) parts.push(`Notes: ${data.errors.join("; ")}`);
      setSendResult(parts.join(" · "));
    } catch (e) {
      setSendResult((e as Error).message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="card p-5">
        <h2 className="font-display text-lg font-bold mb-2">How this works</h2>
        <p className="text-sm text-t2 leading-relaxed">
          We flag learners enrolled in <strong>your tracks</strong> using platform data: module progress, recent
          sign-in (session) activity, and quiz scores when available. You can{" "}
          <strong>send email and/or SMS</strong> to selected students below when your environment is configured (e.g.{" "}
          <code className="text-xs">AUTH_EMAIL_MODE=ses</code> for Amazon SES, Twilio/SNS for SMS). Dev mode typically
          logs only — check server output.
        </p>
      </section>

      <section className="card p-5">
        <div className="flex flex-wrap items-end justify-between gap-2 mb-4">
          <h2 className="font-display text-lg font-bold">Students to watch</h2>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => void load()} disabled={loading}>
            {loading ? "Refreshing…" : "Refresh"}
          </button>
        </div>
        {err && <p className="text-sm text-red-400 mb-2">{err}</p>}
        {loading && !rows && <p className="text-sm text-t3">Loading…</p>}
        {rows && rows.length === 0 && !loading && (
          <p className="text-sm text-t2">No at-risk flags right now for your tracks. Great job — or enrollments are light.</p>
        )}
        {rows && rows.length > 0 && (
          <ul className="space-y-4">
            {rows.map((r) => {
              const k = rowKey(r);
              return (
                <li key={k} className="border-b border-border1 pb-4 last:border-0">
                  <label className="flex gap-3 items-start cursor-pointer">
                    <input
                      type="checkbox"
                      className="mt-1"
                      checked={Boolean(selected[k])}
                      onChange={() => toggle(r)}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold">{r.name}</div>
                      <div className="text-xs text-t3 font-mono">{r.email}</div>
                      <div className="text-sm text-t2 mt-1">Track: {r.trackTitle}</div>
                      <ul className="mt-2 text-sm text-t2 list-disc list-inside space-y-1">
                        {r.reasons.map((x) => (
                          <li key={x}>{x}</li>
                        ))}
                      </ul>
                      <details className="mt-2 text-sm">
                        <summary className="cursor-pointer text-g">Intervention templates (copy)</summary>
                        <div className="mt-2 space-y-2">
                          {TEMPLATES.map((t) => (
                            <div key={t.label} className="bg-s2 rounded-[8px] p-2">
                              <div className="text-xs font-bold text-t3 mb-1">{t.label}</div>
                              <p className="text-t2 whitespace-pre-wrap">{t.body}</p>
                              <div className="flex gap-2 mt-1">
                                <button
                                  type="button"
                                  className="text-xs underline text-g"
                                  onClick={() => void navigator.clipboard.writeText(t.body)}
                                >
                                  Copy
                                </button>
                                <button
                                  type="button"
                                  className="text-xs underline text-t3"
                                  onClick={() => setBody(t.body)}
                                >
                                  Use as message
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </details>
                    </div>
                  </label>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {rows && rows.length > 0 && (
        <section className="card p-5">
          <h2 className="font-display text-lg font-bold mb-1">Bulk outreach</h2>
          <p className="text-sm text-t2 mb-4">
            Select students above, choose channel, and send. Recipients are validated against the current at-risk list
            for safety.
          </p>
          <div className="flex flex-wrap gap-2 mb-3">
            <button type="button" className="btn btn-ghost btn-sm" onClick={selectAll}>
              Select all
            </button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={clearSelection}>
              Clear
            </button>
            <span className="text-sm text-t3 self-center">{selectedList.length} selected</span>
          </div>
          <div className="space-y-3 max-w-lg">
            <div>
              <label className="text-xs text-t3 block mb-1">Channel</label>
              <select
                className="w-full bg-s2 border border-border1 rounded-[8px] px-3 py-2 text-sm"
                value={channel}
                onChange={(e) => setChannel(e.target.value as "email" | "sms" | "both")}
              >
                <option value="email">Email only</option>
                <option value="sms">SMS only (requires verified phone)</option>
                <option value="both">Email + SMS</option>
              </select>
            </div>
            {channel !== "sms" && (
              <div>
                <label className="text-xs text-t3 block mb-1">Subject</label>
                <input
                  className="w-full bg-s2 border border-border1 rounded-[8px] px-3 py-2 text-sm"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>
            )}
            <div>
              <label className="text-xs text-t3 block mb-1">Message</label>
              <textarea
                className="w-full min-h-[120px] bg-s2 border border-border1 rounded-[8px] px-3 py-2 text-sm"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Write a short, supportive message…"
              />
            </div>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              disabled={sending || selectedList.length === 0 || !body.trim()}
              onClick={() => void sendBulk()}
            >
              {sending ? "Sending…" : "Send to selected"}
            </button>
            {sendResult && <p className="text-sm text-t2">{sendResult}</p>}
          </div>
        </section>
      )}
    </div>
  );
}
