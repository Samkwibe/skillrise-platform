"use client";
import { useState } from "react";
import { Avatar } from "@/components/ui/avatar";

type Msg = { id: string; userId: string; text: string; at: number; author?: { name: string; avatar: string } | null };

export function CohortChat({ cohortId, initial, currentUserId }: { cohortId: string; initial: Msg[]; currentUserId: string }) {
  const [messages, setMessages] = useState<Msg[]>(initial);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <div className="card p-4 flex flex-col h-[540px]">
      <div className="flex-1 overflow-y-auto flex flex-col gap-3 pr-1">
        {messages.length === 0 && <div className="text-t3 text-[13px] m-auto">Say hi to your cohort.</div>}
        {messages.map((m) => {
          const isSelf = m.userId === currentUserId;
          return (
            <div key={m.id} className={`flex items-start gap-2 ${isSelf ? "justify-end" : "justify-start"}`}>
              {!isSelf && m.author && <Avatar spec={m.author.avatar} size={28} />}
              <div className={`max-w-[70%] px-3 py-2 rounded-[12px] text-[14px] ${isSelf ? "bg-g text-ink" : "bg-s2 border border-border1 text-t1"}`}>
                {!isSelf && m.author && <div className="text-[11px] font-semibold text-t3 mb-[2px]">{m.author.name}</div>}
                {m.text}
              </div>
            </div>
          );
        })}
      </div>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (!text.trim()) return;
          setBusy(true);
          const res = await fetch(`/api/cohort/${cohortId}/message`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text }),
          });
          const body = await res.json();
          setBusy(false);
          if (res.ok) {
            setMessages((m) => [...m, body.message]);
            setText("");
          }
        }}
        className="flex gap-2 mt-3 border-t border-border1 pt-3"
      >
        <input className="input" placeholder="Share progress, ask a question…" value={text} onChange={(e) => setText(e.target.value)} />
        <button className="btn btn-primary btn-sm" disabled={busy}>Send</button>
      </form>
    </div>
  );
}
