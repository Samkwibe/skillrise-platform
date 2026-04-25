"use client";

import { useEffect, useRef, useState } from "react";

type Msg = { role: "user" | "assistant"; text: string };

const SUGGESTIONS = [
  { id: "announce", label: "Draft Announcement", prompt: "Draft a friendly but urgent reminder about next week’s final project for my cohort. Include bullet points.", icon: "📢" },
  { id: "lesson", label: "Lesson Outline", prompt: "Outline a 45-minute lesson on debugging React applications for beginners. Break it down into 5-minute segments.", icon: "📝" },
  { id: "quiz", label: "Generate Quiz", prompt: "Give me 3 difficult multiple-choice questions on JavaScript closures. Include the correct answer and a brief explanation for each.", icon: "✅" },
  { id: "checkin", label: "Student Check-in", prompt: "Suggest kind, non-judgmental wording for an email to check in with a student who has been quiet and missed the last two deadlines.", icon: "💌" },
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
    <div className="flex flex-col xl:flex-row gap-8 w-full h-[calc(100vh-12rem)]">
      {/* Left Pane: Chat Interface */}
      <div className="flex-1 flex flex-col bg-white/[0.03] border border-white/10 rounded-3xl backdrop-blur-xl overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>
        
        {/* Chat History */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
          {messages.length === 0 ? (
            <div className="m-auto text-center max-w-md">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-2xl mx-auto mb-6 shadow-[0_0_30px_rgba(99,102,241,0.3)]">✨</div>
              <h3 className="text-2xl font-bold text-white mb-3">AI Teaching Assistant</h3>
              <p className="text-sm text-t2 leading-relaxed mb-8">
                Draft announcements, lesson outlines, and quiz ideas. The AI has access to your course context. Nothing is sent to students until you approve and copy it.
              </p>
            </div>
          ) : (
            messages.map((m, i) => (
              <div key={i} className={`flex w-full ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`flex gap-4 max-w-[85%] ${m.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm shadow-lg ${
                    m.role === "user" ? "bg-white/10" : "bg-gradient-to-br from-indigo-500 to-purple-600"
                  }`}>
                    {m.role === "user" ? "🧑‍🏫" : "✨"}
                  </div>
                  <div className={`p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                    m.role === "user" 
                      ? "bg-indigo-600 text-white rounded-tr-sm" 
                      : "bg-white/[0.05] border border-white/10 text-t1 rounded-tl-sm"
                  }`}>
                    {m.text || (m.role === "assistant" && busy ? "Thinking..." : "")}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 bg-black/40 border-t border-white/10 backdrop-blur-md relative z-10">
          <div className="relative">
            <input
              className="w-full bg-white/[0.05] border border-white/10 rounded-2xl pl-6 pr-16 py-4 text-white text-sm focus:ring-2 focus:ring-indigo-500/50 focus:outline-none transition-all placeholder:text-t3"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), send(input))}
              placeholder="Ask for a draft, outline, or quiz ideas…"
              disabled={busy}
            />
            <button 
              type="button" 
              className="absolute right-2 top-2 bottom-2 w-12 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center transition-all disabled:opacity-50 shadow-lg shadow-indigo-600/20" 
              disabled={busy || !input.trim()} 
              onClick={() => send(input)}
            >
              {busy ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : "↑"}
            </button>
          </div>
        </div>
      </div>

      {/* Right Pane: Templates & Context */}
      <div className="w-full xl:w-[320px] shrink-0 flex flex-col gap-6">
        <section className="p-6 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-xl flex-1">
          <h2 className="text-[11px] font-bold uppercase tracking-wider text-t3 mb-4 flex items-center gap-2">
            <span>📚</span> One-Click Templates
          </h2>
          <p className="text-xs text-t2 mb-6">Quickly generate high-quality content using these proven prompts.</p>
          
          <div className="space-y-3">
            {SUGGESTIONS.map((s) => (
              <button
                key={s.id}
                onClick={() => { setInput(s.prompt); }}
                className="w-full text-left p-4 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.08] hover:border-white/20 transition-all group flex items-start gap-3"
              >
                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  {s.icon}
                </div>
                <div>
                  <div className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors mb-1">{s.label}</div>
                  <div className="text-[10px] text-t3 line-clamp-2">{s.prompt}</div>
                </div>
              </button>
            ))}
          </div>

          <div className="mt-8 pt-6 border-t border-white/10">
            <h2 className="text-[11px] font-bold uppercase tracking-wider text-t3 mb-3 flex items-center gap-2">
              <span>🧠</span> Context Awareness
            </h2>
            <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20 flex items-start gap-2">
              <span className="text-green-400 mt-0.5">✓</span>
              <p className="text-[11px] text-green-100/70 leading-relaxed">
                The AI automatically knows your current courses and student engagement metrics to provide relevant answers.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
