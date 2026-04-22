"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

export type ToastKind = "info" | "success" | "warning" | "error";

export type Toast = {
  id: string;
  kind: ToastKind;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  durationMs?: number;
};

type ToastContextValue = {
  push: (t: Omit<Toast, "id"> & { id?: string }) => string;
  dismiss: (id: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const KIND_STYLES: Record<ToastKind, { accent: string; bg: string; icon: string }> = {
  info: { accent: "var(--blue)", bg: "color-mix(in srgb, var(--blue) 10%, var(--surface-1))", icon: "ⓘ" },
  success: { accent: "var(--g)", bg: "color-mix(in srgb, var(--g) 10%, var(--surface-1))", icon: "✓" },
  warning: { accent: "var(--amber)", bg: "color-mix(in srgb, var(--amber) 10%, var(--surface-1))", icon: "⚠" },
  error: { accent: "var(--red)", bg: "color-mix(in srgb, var(--red) 10%, var(--surface-1))", icon: "✕" },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: string) => {
    setToasts((list) => list.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) clearTimeout(timer);
    timers.current.delete(id);
  }, []);

  const push = useCallback<ToastContextValue["push"]>(
    (t) => {
      const id = t.id ?? `toast-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      setToasts((list) => [...list.filter((x) => x.id !== id), { ...t, id }]);
      const ms = t.durationMs ?? (t.kind === "error" ? 7000 : 4000);
      const timer = setTimeout(() => dismiss(id), ms);
      timers.current.set(id, timer);
      return id;
    },
    [dismiss],
  );

  useEffect(() => {
    const curr = timers.current;
    return () => {
      curr.forEach((t) => clearTimeout(t));
      curr.clear();
    };
  }, []);

  return (
    <ToastContext.Provider value={{ push, dismiss }}>
      {children}
      <div
        aria-live="polite"
        className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-[380px] w-[calc(100vw-32px)] sm:w-auto pointer-events-none"
      >
        {toasts.map((t) => {
          const s = KIND_STYLES[t.kind];
          return (
            <div
              key={t.id}
              role="status"
              className="pointer-events-auto animate-fade-in-up"
              style={{
                background: s.bg,
                border: `1px solid ${s.accent}`,
                borderRadius: 12,
                padding: "12px 14px",
                boxShadow: "0 12px 30px rgba(0,0,0,0.18)",
                backdropFilter: "blur(8px)",
              }}
            >
              <div className="flex items-start gap-3">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center font-bold shrink-0 mt-0.5"
                  style={{ background: s.accent, color: "#fff" }}
                >
                  {s.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[13.5px] font-bold leading-tight" style={{ color: "var(--text-1)" }}>
                    {t.title}
                  </div>
                  {t.description && (
                    <div className="text-[12.5px] mt-0.5" style={{ color: "var(--text-2)" }}>
                      {t.description}
                    </div>
                  )}
                  {t.actionLabel && t.onAction && (
                    <button
                      type="button"
                      onClick={() => {
                        t.onAction!();
                        dismiss(t.id);
                      }}
                      className="mt-1.5 text-[12px] font-bold underline"
                      style={{ color: s.accent }}
                    >
                      {t.actionLabel}
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  aria-label="Dismiss"
                  onClick={() => dismiss(t.id)}
                  className="text-[16px] leading-none opacity-60 hover:opacity-100"
                  style={{ color: "var(--text-2)" }}
                >
                  ×
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within <ToastProvider>");
  return ctx;
}
