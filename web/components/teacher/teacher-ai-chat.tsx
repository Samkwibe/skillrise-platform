"use client";

import { useEffect, useRef, useState } from "react";

type Msg = { role: "user" | "assistant"; text: string };

const SUGGESTIONS = [
  "Draft a reminder about next week’s quiz for my cohort.",
  "Outline a 45-minute lesson on budgeting for beginners.",
  "Give me 3 multiple-choice questions on electrical safety.",
  "Suggest kind wording to check in with a student who has been quiet.",
];

export function TeacherAiChat() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  function autoScroll() {
    queueMicrotask(() =>
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }),
    );
  }

  useEffect(() => {
    autoScroll();
  }, [messages]);

  async function send(text: string) {
    const clean = text.trim();
    if (!clean || busy) return;

    const history = messages.slice(-10).map((m) => ({ role: m.role, content: m.text }));
    setMessages((m) => [...m, { role: "user", text: clean }, { role: "assistant", text: "" }]);
    setInput("");
    setBusy(true);

    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      const res = await fetch("/api/teacher/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: clean, history, stream: true }),
        signal: ctrl.signal,
      });

      if (!res.ok || !res.body) {
        const fallback = await res.text().catch(() => "Assistant is unavailable. Try again.");
        setMessages((m) => {
          const copy = [...m];
          copy[copy.length - 1] = { role: "assistant", text: fallback || "No reply." };
          return copy;
        });
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setMessages((m) => {
          const copy = [...m];
          copy[copy.length - 1] = { role: "assistant", text: acc };
          return copy;
        });
        autoScroll();
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setMessages((m) => {
          const copy = [...m];
          copy[copy.length - 1] = { role: "assistant", text: "Connection interrupted. Try again." };
          return copy;
        });
      }
    } finally {
      setBusy(false);
      abortRef.current = null;
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div ref={scrollRef} className="card p-4 h-[min(520px,70vh)] overflow-y-auto flex flex-col gap-3">
        {messages.length === 0 && (
          <div className="text-t3 text-sm m-auto text-center max-w-md">
            <div className="text-base text-t1 font-semibold mb-1">AI Teaching Assistant</div>
            <p className="mb-3 leading-relaxed">
              Draft announcements, lesson outlines, and quiz ideas. Uses the same AI stack as the learner tutor
              (Gemini / OpenAI when configured). Nothing is sent to students until you copy and send it yourself.
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => send(s)}
                  className="pill pill-g text-xs sm:text-sm hover:brightness-110 micro-hover"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={`max-w-[95%] rounded-[12px] px-3 py-2 text-sm leading-relaxed ${
              m.role === "user"
                ? "self-end bg-[color-mix(in_srgb,var(--g)_18%,transparent)] border border-border1"
                : "self-start bg-s2 border border-border1"
            }`}
          >
            {m.text || (m.role === "assistant" && busy ? "…" : "")}
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          className="input flex-1"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), send(input))}
          placeholder="Ask for a draft, outline, or quiz ideas…"
          disabled={busy}
        />
        <button type="button" className="btn btn-primary shrink-0" disabled={busy} onClick={() => send(input)}>
          Send
        </button>
      </div>
    </div>
  );
}
