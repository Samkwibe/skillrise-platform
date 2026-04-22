import Link from "next/link";
import type { User } from "@/lib/store";
import { Avatar } from "@/components/ui/avatar";
import { RoleStyler } from "@/components/theme/role-styler";
import { LogoutButton } from "@/components/logout-button";
import { CmdkTrigger } from "@/components/cmdk-trigger";

/**
 * School shell — "Admin portal" (Google Workspace / Workday feel).
 * Forced light, table-first, tabular numerals, minimal chrome, print-friendly.
 */
const ADMIN_GROUPS: Array<{ title: string; items: Array<{ href: string; label: string }> }> = [
  {
    title: "Administration",
    items: [
      { href: "/dashboard", label: "Overview" },
      { href: "/schools/dashboard", label: "Classes" },
      { href: "/schools/dashboard#students", label: "Students" },
      { href: "/schools/dashboard#certificates", label: "Certificates" },
    ],
  },
  {
    title: "Reports",
    items: [
      { href: "/schools/dashboard#reports", label: "Cohort completion" },
      { href: "/schools/dashboard#audit", label: "Audit log" },
    ],
  },
  {
    title: "Directory",
    items: [
      { href: "/tracks", label: "Skill tracks catalog" },
      { href: "/profile", label: "School profile" },
    ],
  },
];

export function SchoolShell({ user, children }: { user: User; children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex" style={{ background: "var(--bg)", color: "var(--text-1)" }}>
      <RoleStyler role="school" />

      <aside
        className="hidden lg:flex flex-col w-[220px] 3xl:w-[260px] 4k:w-[300px] shrink-0 sticky top-0 h-screen overflow-y-auto"
        style={{ background: "var(--surface-1)", borderRight: "1px solid var(--border-1)" }}
      >
        <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--border-1)" }}>
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-[6px] flex items-center justify-center font-bold"
              style={{ background: "var(--g)", color: "#fff" }}
            >
              ⌂
            </div>
            <div>
              <div className="text-[14px] font-bold leading-tight">
                {user.company || "School"}
              </div>
              <div className="text-[11px]" style={{ color: "var(--text-3)" }}>
                Admin console
              </div>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-3">
          {ADMIN_GROUPS.map((g) => (
            <div key={g.title} className="mb-4">
              <div className="text-[10.5px] font-bold uppercase tracking-[0.1em] px-2 mb-1" style={{ color: "var(--text-3)" }}>
                {g.title}
              </div>
              <div className="flex flex-col">
                {g.items.map((i) => (
                  <Link
                    key={i.href}
                    href={i.href}
                    className="px-3 py-[7px] text-[13px] rounded-[4px] hover:bg-[var(--surface-2)] transition-colors"
                    style={{ color: "var(--text-2)" }}
                  >
                    {i.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-3" style={{ borderTop: "1px solid var(--border-1)" }}>
          <Link href="/profile" className="flex items-center gap-2 px-2 py-1.5 rounded-[4px] hover:bg-[var(--surface-2)]">
            <Avatar spec={user.avatar} size={28} />
            <div className="min-w-0">
              <div className="text-[12.5px] font-semibold truncate">{user.name}</div>
              <div className="text-[11px] truncate" style={{ color: "var(--text-3)" }}>
                Admin
              </div>
            </div>
          </Link>
          <LogoutButton />
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        <header
          className="sticky top-0 z-40 flex items-center gap-2 sm:gap-3 px-4 sm:px-5 h-[52px]"
          style={{ background: "var(--surface-1)", borderBottom: "1px solid var(--border-1)" }}
        >
          <details className="lg:hidden">
            <summary className="list-none cursor-pointer px-2 py-1 text-[18px]">☰</summary>
            <div
              className="absolute left-3 top-12 p-2 w-[230px] z-50"
              style={{ background: "var(--surface-1)", border: "1px solid var(--border-1)", borderRadius: 6 }}
            >
              {ADMIN_GROUPS.flatMap((g) => g.items).map((i) => (
                <Link key={i.href} href={i.href} className="block px-3 py-2 text-[13px] hover:bg-[var(--surface-2)] rounded">
                  {i.label}
                </Link>
              ))}
            </div>
          </details>
          <div className="text-[11px] font-bold uppercase tracking-[0.12em] truncate hidden xs:block" style={{ color: "var(--text-3)" }}>
            School Admin
          </div>
          <nav className="hidden md:flex items-center gap-1 text-[13px]" style={{ color: "var(--text-2)" }}>
            <span>/</span>
            <span className="font-semibold" style={{ color: "var(--text-1)" }}>
              Overview
            </span>
          </nav>
          <div className="ml-auto flex items-center gap-2 shrink-0">
            <CmdkTrigger />
            <button
              type="button"
              className="hidden sm:inline-flex text-[12px] px-3 py-1.5 rounded-[4px]"
              style={{ border: "1px solid var(--border-2)", color: "var(--text-2)" }}
            >
              Export CSV
            </button>
            <Link
              href="/schools/dashboard"
              className="text-[12px] px-3 py-1.5 rounded-[4px] font-semibold whitespace-nowrap"
              style={{ background: "var(--g)", color: "#fff" }}
            >
              <span className="sm:hidden">+ Class</span>
              <span className="hidden sm:inline">+ Add class</span>
            </Link>
          </div>
        </header>
        <main className="flex-1 min-w-0 3xl:max-w-[2000px] 4k:max-w-[2400px] 3xl:mx-auto w-full">{children}</main>
      </div>
    </div>
  );
}
