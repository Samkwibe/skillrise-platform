"use client";

import { useEffect } from "react";
import type { Role } from "@/lib/store";

/** Roles that ignore the user's dark/light preference and force a specific mode. */
const FORCED_MODE: Partial<Record<Role, "light" | "dark">> = {
  employer: "light",
  school: "light",
  teacher: "dark",
  teen: "dark",
  // learner + admin honor the user's theme toggle
};

/**
 * Applies `data-role` to <html> and enforces a theme mode for roles whose
 * visual language requires it (HR tools are light, studios are dark, etc.).
 */
export function RoleStyler({ role }: { role: Role }) {
  useEffect(() => {
    const html = document.documentElement;
    html.setAttribute("data-role", role);

    const forced = FORCED_MODE[role];
    if (forced) {
      html.classList.remove("dark", "light");
      html.classList.add(forced);
      html.style.colorScheme = forced;
    }

    return () => {
      html.removeAttribute("data-role");
    };
  }, [role]);

  return null;
}
