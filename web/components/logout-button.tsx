"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function LogoutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        await fetch("/api/auth/logout", { method: "POST" });
        router.push("/");
        router.refresh();
      }}
      className="text-left text-[12px] text-t3 px-3 py-[7px] hover:text-red disabled:opacity-60"
    >
      {busy ? "Signing out…" : "Sign out"}
    </button>
  );
}
