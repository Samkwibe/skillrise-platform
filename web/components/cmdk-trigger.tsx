"use client";

/** Tiny trigger button that opens the global ⌘K palette. */
export function CmdkTrigger({
  className = "",
  variant = "chip",
}: {
  className?: string;
  variant?: "chip" | "bar";
}) {
  const open = () => {
    if (typeof window === "undefined") return;
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }));
  };

  if (variant === "bar") {
    return (
      <button
        type="button"
        onClick={open}
        aria-label="Open command palette"
        className={`inline-flex items-center gap-2 px-3 py-2 rounded-[8px] text-[13px] w-full max-w-[380px] ${className}`}
        style={{
          background: "var(--surface-2)",
          border: "1px solid var(--border-1)",
          color: "var(--text-3)",
        }}
      >
        <span>⌕</span>
        <span className="flex-1 text-left">Search or jump to…</span>
        <span
          className="text-[10.5px] font-mono px-1.5 py-0.5 rounded"
          style={{ background: "var(--surface-3)", color: "var(--text-2)" }}
        >
          ⌘K
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={open}
      aria-label="Open command palette"
      className={`inline-flex items-center gap-2 px-2.5 py-1.5 rounded-[10px] text-[12px] ${className}`}
      style={{
        background: "var(--surface-2)",
        border: "1px solid var(--border-1)",
        color: "var(--text-3)",
      }}
    >
      <span>⌕</span>
      <span className="hidden sm:inline">Search</span>
      <span
        className="text-[10.5px] font-mono px-1 py-0.5 rounded"
        style={{ background: "var(--surface-3)", color: "var(--text-2)" }}
      >
        ⌘K
      </span>
    </button>
  );
}
