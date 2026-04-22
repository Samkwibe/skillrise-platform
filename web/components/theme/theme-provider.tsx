"use client";
import { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light" | "system";
type Resolved = "dark" | "light";

type ThemeContextValue = {
  theme: Theme;
  resolved: Resolved;
  setTheme: (t: Theme) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = "skillrise:theme";

function resolve(theme: Theme): Resolved {
  if (theme !== "system") return theme;
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(resolved: Resolved) {
  const root = document.documentElement;
  root.classList.toggle("dark", resolved === "dark");
  root.classList.toggle("light", resolved === "light");
  root.style.colorScheme = resolved;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("dark");
  const [resolved, setResolved] = useState<Resolved>("dark");

  useEffect(() => {
    const stored = (localStorage.getItem(STORAGE_KEY) as Theme | null) ?? "dark";
    const r = resolve(stored);
    setThemeState(stored);
    setResolved(r);
    applyTheme(r);

    if (stored === "system") {
      const mql = window.matchMedia("(prefers-color-scheme: dark)");
      const onChange = () => {
        const r2 = mql.matches ? "dark" : "light";
        setResolved(r2);
        applyTheme(r2);
      };
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    }
  }, []);

  const setTheme = (t: Theme) => {
    localStorage.setItem(STORAGE_KEY, t);
    const r = resolve(t);
    setThemeState(t);
    setResolved(r);
    applyTheme(r);
  };

  return (
    <ThemeContext.Provider value={{ theme, resolved, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within <ThemeProvider>");
  return ctx;
}
