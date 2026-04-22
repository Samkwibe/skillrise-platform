"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

const STATES = ["submitted", "reviewed", "interview", "offered", "hired", "rejected"] as const;
type State = (typeof STATES)[number];

export function ApplicantStatusSelect({ appId, current }: { appId: string; current: State }) {
  const router = useRouter();
  const [value, setValue] = useState<State>(current);
  return (
    <select
      value={value}
      className="input max-w-[140px] text-[12px]"
      onChange={async (e) => {
        const next = e.target.value as State;
        setValue(next);
        await fetch(`/api/applications/${appId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: next }),
        });
        router.refresh();
      }}
    >
      {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
    </select>
  );
}
