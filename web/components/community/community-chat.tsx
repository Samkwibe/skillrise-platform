"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Avatar } from "@/components/ui/avatar";

type Author = { id: string; name: string; role: string; avatar: string } | null;
type Message = {
  id: string;
  roomId: string;
  userId: string;
  text: string;
  at: number;
  hidden?: boolean;
  author: Author;
};

type Props = {
  roomId: string;
  currentUser: { id: string; name: string; avatar: string; role: string };
  initialMessages: Message[];
};

/**
 * Community chat. Uses polling (every 5s) instead of websockets — good enough
 * for in-memory demo scale and survives serverless environments without
 * sticky connections. When we move to DynamoDB + App Runner, swap this for
 * SSE or AWS AppSync subscriptions.
 */
type SupportNudge = { message: string; tips: string[] } | null;

export function CommunityChat({ roomId, currentUser, initialMessages }: Props) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState("");
  const [nudge, setNudge] = useState<SupportNudge>(null);
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const lastSeenAt = useRef<number>(
    initialMessages.length ? initialMessages[initialMessages.length - 1].at : 0,
  );

  const scrollToBottom = useCallback((smooth = true) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: smooth ? "smooth" : "auto" });
  }, []);

  useEffect(() => {
    scrollToBottom(false);
  }, [scrollToBottom]);

  // Poll for new messages every 5s. Cheap and reliable.
  useEffect(() => {
    let stopped = false;
    const tick = async () => {
      try {
        const res = await fetch(`/api/community/rooms/${roomId}/messages`, { cache: "no-store" });
        if (!res.ok) return;
        const body: { messages: Message[] } = await res.json();
        if (stopped) return;
        setMessages((prev) => {
          // Keep only unique messages (by id) to avoid dupes after optimistic sends.
          const map = new Map<string, Message>();
          for (const m of prev) map.set(m.id, m);
          for (const m of body.messages) map.set(m.id, m);
          return Array.from(map.values()).sort((a, b) => a.at - b.at);
        });
        const latest = body.messages[body.messages.length - 1];
        if (latest && latest.at > lastSeenAt.current) {
          lastSeenAt.current = latest.at;
          // Only auto-scroll if user is already near the bottom (within 80px).
          const el = scrollerRef.current;
          if (el && el.scrollHeight - (el.scrollTop + el.clientHeight) < 80) {
            scrollToBottom(true);
          }
        }
      } catch {
        // Swallow transient errors; try again on next tick.
      }
    };
    const intv = setInterval(tick, 5000);
    return () => {
      stopped = true;
      clearInterval(intv);
    };
  }, [roomId, scrollToBottom]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setSending(true);
    setErr("");
    const tempId = `local_${Date.now()}`;
    const optimistic: Message = {
      id: tempId,
      roomId,
      userId: currentUser.id,
      text: trimmed,
      at: Date.now(),
      author: {
        id: currentUser.id,
        name: currentUser.name,
        avatar: currentUser.avatar,
        role: currentUser.role,
      },
    };
    setMessages((m) => [...m, optimistic]);
    setText("");
    scrollToBottom(true);
    try {
      const res = await fetch(`/api/community/rooms/${roomId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: trimmed }),
      });
      const body = await res.json();
      if (!res.ok) {
        // On 202, the server took the message but hid it for moderator review.
        if (res.status === 202) {
          setErr(body.error ?? "Your message is under review.");
          setMessages((m) => m.filter((x) => x.id !== tempId));
        } else {
          setErr(body.error ?? "Could not send. Try again?");
          setMessages((m) => m.filter((x) => x.id !== tempId));
        }
        return;
      }
      setMessages((m) =>
        m.map((x) => (x.id === tempId ? (body.message as Message) : x)),
      );
      // If our AI sentiment/topic check flagged the message as crisis-adjacent,
      // show a gentle support card. The message itself still posted — we
      // never silence a user who's struggling; we just offer a hand.
      if (body.supportNudge) setNudge(body.supportNudge as SupportNudge);
    } catch {
      setErr("Network hiccup. Try again?");
      setMessages((m) => m.filter((x) => x.id !== tempId));
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="cover-card overflow-hidden flex flex-col" style={{ height: "min(70vh, 620px)" }}>
      <div
        ref={scrollerRef}
        className="flex-1 overflow-y-auto px-4 md:px-5 py-4"
        style={{ background: "var(--surface-1)" }}
      >
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-[14px]" style={{ color: "var(--text-3)" }}>
            No messages yet. Be the first to say hi.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {messages.map((m) => {
              const mine = m.userId === currentUser.id;
              return (
                <div key={m.id} className={`flex gap-2.5 ${mine ? "flex-row-reverse" : ""}`}>
                  {m.author ? (
                    <Avatar spec={m.author.avatar} size={32} />
                  ) : (
                    <div className="w-8 h-8 rounded-full" style={{ background: "var(--surface-2)" }} />
                  )}
                  <div className={`max-w-[78%] ${mine ? "text-right" : ""}`}>
                    <div className="text-[11px] mb-0.5" style={{ color: "var(--text-3)" }}>
                      {m.author?.name ?? "Unknown"}
                      {m.author?.role === "teacher" && (
                        <span className="ml-1.5 px-1.5 py-[1px] rounded-full text-[9.5px] font-bold" style={{ background: "var(--g)", color: "var(--bg)" }}>
                          TEACHER
                        </span>
                      )}
                    </div>
                    <div
                      className="inline-block px-3.5 py-2 rounded-[16px] text-[14px]"
                      style={{
                        background: mine ? "var(--g)" : "var(--surface-2)",
                        color: mine ? "var(--bg)" : "var(--text-1)",
                        borderTopLeftRadius: mine ? 16 : 4,
                        borderTopRightRadius: mine ? 4 : 16,
                      }}
                    >
                      {m.text}
                    </div>
                    <div className="text-[10.5px] mt-1" style={{ color: "var(--text-3)" }}>
                      {formatWhen(m.at)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {nudge && (
        <div
          role="alert"
          className="px-4 py-3 text-[13px] flex items-start gap-3"
          style={{
            background: "color-mix(in srgb, var(--g) 12%, var(--surface-1))",
            borderTop: "1px solid color-mix(in srgb, var(--g) 40%, var(--border-1))",
            color: "var(--text-1)",
          }}
        >
          <span className="text-[18px]" aria-hidden>💛</span>
          <div className="flex-1 min-w-0">
            <div className="font-bold mb-1">{nudge.message}</div>
            <ul className="text-[12.5px] list-none m-0 p-0 flex flex-col gap-0.5" style={{ color: "var(--text-2)" }}>
              {nudge.tips.map((t, i) => (
                <li key={i}>· {t}</li>
              ))}
            </ul>
          </div>
          <button
            type="button"
            aria-label="Dismiss"
            onClick={() => setNudge(null)}
            className="text-[18px] leading-none px-1"
            style={{ color: "var(--text-3)" }}
          >
            ×
          </button>
        </div>
      )}

      {err && (
        <div className="px-4 py-2 text-[12.5px]" style={{ background: "rgba(227,75,75,0.10)", color: "#ffb0b0", borderTop: "1px solid var(--border-1)" }}>
          {err}
        </div>
      )}

      <form onSubmit={send} className="flex items-center gap-2 px-3 md:px-4 py-3" style={{ borderTop: "1px solid var(--border-1)", background: "var(--surface-2)" }}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Say something helpful…"
          maxLength={1200}
          className="flex-1 px-3.5 py-2.5 rounded-full text-[14px]"
          style={{
            background: "var(--surface-1)",
            border: "1px solid var(--border-1)",
            color: "var(--text-1)",
          }}
        />
        <button
          type="submit"
          disabled={sending || !text.trim()}
          className="px-4 py-2.5 rounded-full font-bold text-[13.5px] disabled:opacity-50"
          style={{ background: "var(--g)", color: "var(--bg)" }}
        >
          {sending ? "…" : "Send"}
        </button>
      </form>
    </div>
  );
}

function formatWhen(at: number) {
  const diff = Date.now() - at;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(at).toLocaleDateString();
}
