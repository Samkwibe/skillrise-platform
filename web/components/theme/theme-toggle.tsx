"use client";
import { useTheme } from "./theme-provider";

const LABEL: Record<string, string> = {
  dark: "Dark",
  light: "Light",
  system: "System",
};

const NEXT: Record<string, "dark" | "light" | "system"> = {
  dark: "light",
  light: "system",
  system: "dark",
};

const ICON: Record<string, string> = {
  dark: "🌙",
  light: "☀️",
  system: "🖥",
};

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { theme, setTheme } = useTheme();
  return (
    <button
      type="button"
      aria-label={`Theme: ${theme}. Click to cycle.`}
      onClick={() => setTheme(NEXT[theme])}
      className={`inline-flex items-center gap-2 rounded-[10px] border border-border2 bg-[var(--surface-2)] hover:border-g transition-colors text-[13px] font-medium text-t2 hover:text-t1 ${compact ? "px-2 py-[6px]" : "px-3 py-[7px]"}`}
    >
      <span aria-hidden>{ICON[theme]}</span>
      {!compact && <span>{LABEL[theme]}</span>}
    </button>
  );
}

export function ThemeSelect() {
  const { theme, setTheme } = useTheme();
  return (
    <div role="group" aria-label="Theme" className="inline-flex rounded-[10px] border border-border2 overflow-hidden bg-[var(--surface-2)]">
      {(["light", "dark", "system"] as const).map((t) => (
        <button
          key={t}
          type="button"
          onClick={() => setTheme(t)}
          aria-pressed={theme === t}
          className={`px-3 py-[6px] text-[12px] font-semibold capitalize ${theme === t ? "bg-g text-ink" : "text-t2 hover:text-t1"}`}
        >
          {t}
        </button>
      ))}
    </div>
  );
}
