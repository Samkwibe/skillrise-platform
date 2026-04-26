"use client";

import type { ReactNode } from "react";
import { useId, useState } from "react";

type Props = {
  id: string;
  label: ReactNode;
  value: string;
  onChange: (value: string) => void;
  autoComplete: string;
  required?: boolean;
  minLength?: number;
  labelRight?: ReactNode;
  /** Shown below the field (e.g. password rules + strength meter). */
  footer?: ReactNode;
};

export function AuthPasswordInput({
  id,
  label,
  value,
  onChange,
  autoComplete,
  required = true,
  minLength,
  labelRight,
  footer,
}: Props) {
  const [visible, setVisible] = useState(false);
  const footerId = useId();

  return (
    <div>
      <div className="flex items-center justify-between gap-2 mb-2">
        <label className="label mb-0" htmlFor={id}>
          {label}
        </label>
        {labelRight}
      </div>
      <div className="relative">
        <input
          id={id}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          required={required}
          minLength={minLength}
          className="input pr-[4.25rem]"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-describedby={footer ? footerId : undefined}
        />
        <button
          type="button"
          className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[11px] font-bold uppercase tracking-wide text-t3 hover:text-g px-2.5 py-1.5 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-g/40"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? "Hide" : "Show"}
        </button>
      </div>
      {footer ? (
        <div id={footerId} className="mt-1 space-y-1">
          {footer}
        </div>
      ) : null}
    </div>
  );
}
