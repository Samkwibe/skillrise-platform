"use client";
import { useEffect, useRef, useState } from "react";

type Msg = { role: "user" | "assistant"; text: string };

const SUGGESTIONS = [
  "Quiz me on my current module.",
  "Explain Ohm's law with a 12V example.",
  "Practice an apprentice interview with me.",
  "Give me a real budget for $18/hr after taxes.",
];

export function AssistantChat({ initial }: { initial: Msg[] }) {
  const [messages, setMessages] = useState<Msg[]>(initial);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [streaming, setStreaming] = useState(false);
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
    setStreaming(true);

    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: clean, history, stream: true }),
        signal: ctrl.signal,
      });

      if (!res.ok || !res.body) {
        const fallback = await res.text().catch(() => "Tutor is taking a break. Try again.");
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
      setStreaming(false);
      abortRef.current = null;
    }
  }

  function stop() {
    abortRef.current?.abort();
  }

  return (
    <div className="flex flex-col gap-4">
      <div
        ref={scrollRef}
        className="card p-4 h-[480px] overflow-y-auto flex flex-col gap-3"
      >
        {messages.length === 0 && (
          <div className="text-t3 text-[13px] m-auto text-center animate-fade-in">
            <div className="text-[15px] text-t1 font-semibold mb-1">SkillRise Tutor</div>
            <div className="mb-3">A real-world mentor that quizzes, coaches, and explains.</div>
            <div className="flex flex-wrap gap-2 justify-center">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => send(s)}
                  className="pill pill-g hover:brightness-110 micro-hover"
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
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"} animate-fade-in`}
          >
            <div
              className={`max-w-[82%] px-4 py-3 rounded-[14px] text-[14px] leading-relaxed whitespace-pre-wrap ${
                m.role === "user"
                  ? "bg-g text-ink"
                  : "bg-s2 text-t1 border border-border1"
              }`}
            >
              {m.text || (streaming && i === messages.length - 1 ? "…" : "")}
            </div>
          </div>
        ))}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="flex gap-2"
      >
        <input
          className="input"
          placeholder="Ask your AI tutor anything…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={busy}
        />
        {streaming ? (
          <button type="button" className="btn btn-ghost" onClick={stop}>
            Stop
          </button>
        ) : (
          <button className="btn btn-primary" disabled={busy}>
            Send
          </button>
        )}
      </form>
      <p className="text-[11px] text-t3 text-center">
        The tutor uses <span className="font-mono">OPENAI_API_KEY</span> when set; otherwise responds with a smart mock.
      </p>
    </div>
  );
}
