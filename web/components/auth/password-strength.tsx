"use client";

import { useMemo } from "react";

export function PasswordStrength({ password }: { password: string }) {
  const score = useMemo(() => {
    if (!password) return 0;
    let s = 0;
    if (password.length >= 8) s += 1;
    if (password.length >= 12) s += 1;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) s += 1;
    if (/[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password)) s += 1;
    return s;
  }, [password]);

  const segments = 4;
  const colors = ["bg-border1", "bg-red-500", "bg-amber-500", "bg-amber-400", "bg-g"];

  return (
    <div className="mt-2 flex flex-col gap-1.5 animate-in fade-in duration-300">
      <div className="flex gap-1 h-1.5 w-full rounded-full overflow-hidden">
        {Array.from({ length: segments }).map((_, i) => {
          let activeColor = "bg-border1";
          if (score > 0 && i < score) {
            activeColor = colors[score];
          }
          return (
            <div
              key={i}
              className={`h-full flex-1 transition-colors duration-300 ${activeColor}`}
            />
          );
        })}
      </div>
      <div className="flex justify-between items-center text-[11px] font-medium text-t3">
        <span>Password strength</span>
        {score === 0 && <span>Too short</span>}
        {score === 1 && <span className="text-red-400">Weak</span>}
        {score === 2 && <span className="text-amber-500">Fair</span>}
        {score === 3 && <span className="text-amber-400">Good</span>}
        {score === 4 && <span className="text-g">Strong</span>}
      </div>
    </div>
  );
}
