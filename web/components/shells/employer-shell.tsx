import Link from "next/link";
import type { User } from "@/lib/store";
import { Avatar } from "@/components/ui/avatar";
import { RoleStyler } from "@/components/theme/role-styler";
import { LogoutButton } from "@/components/logout-button";
import { CmdkTrigger } from "@/components/cmdk-trigger";

/**
 * Employer shell — "HR / recruiting dashboard" (Greenhouse / Ashby feel).
 * Forced light mode. Left pipeline/filter rail, crisp search top bar.
 * No learning content at all.
 */
export function EmployerShell({ user, children }: { user: User; children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex" style={{ background: "var(--bg)", color: "var(--text-1)" }}>
      <RoleStyler role="employer" />

      <aside
        className="hidden lg:flex flex-col w-[232px] 3xl:w-[280px] 4k:w-[320px] shrink-0 sticky top-0 h-screen overflow-y-auto"
        style={{ background: "var(--surface-1)", borderRight: "1px solid var(--border-1)" }}
      >
        <div className="px-5 py-5" style={{ borderBottom: "1px solid var(--border-1)" }}>
          <div className="text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color: "var(--g)" }}>
            Talent Hub
          </div>
          <div className="font-extrabold text-[18px] mt-1" style={{ letterSpacing: "-0.01em" }}>
            {user.company || "SkillRise"}
          </div>
          <div className="text-[12px] mt-0.5" style={{ color: "var(--text-3)" }}>
            Recruiting workspace
          </div>
        </div>

        <nav className="px-4 py-4 flex flex-col gap-[2px]">
          {[
            { href: "/dashboard", label: "Overview", icon: "▤" },
            { href: "/employers/dashboard", label: "Pipeline", icon: "⟶" },
            { href: "/jobs", label: "All roles", icon: "▦" },
            { href: "/employers/post", label: "Post a role", icon: "+" },
          ].map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="flex items-center gap-3 px-3 py-2 rounded-[8px] text-[13.5px] font-medium hover:bg-[var(--surface-2)] transition-colors"
              style={{ color: "var(--text-2)" }}
            >
              <span className="w-5 text-center font-mono text-[15px]" style={{ color: "var(--text-3)" }}>
                {l.icon}
              </span>
              <span>{l.label}</span>
            </Link>
          ))}
        </nav>

        <div className="px-5 pt-2 pb-1 text-[11px] font-bold uppercase tracking-[0.12em]" style={{ color: "var(--text-3)" }}>
          Filter pipeline
        </div>
        <div className="px-4 flex flex-col gap-[2px]">
          {[
            ["Applied", "applied"],
            ["Shortlisted", "shortlisted"],
            ["Interview", "interview"],
            ["Hired", "hired"],
            ["Rejected", "rejected"],
          ].map(([label, key]) => (
            <Link
              key={key}
              href={`/employers/dashboard?stage=${key}`}
              className="flex items-center justify-between px-3 py-1.5 rounded-[6px] text-[12.5px] hover:bg-[var(--surface-2)]"
              style={{ color: "var(--text-2)" }}
            >
              <span>{label}</span>
              <span className="text-[11px]" style={{ color: "var(--text-3)" }}>
                ›
              </span>
            </Link>
          ))}
        </div>

        <div className="mt-auto p-4" style={{ borderTop: "1px solid var(--border-1)" }}>
          <Link
            href="/profile"
            className="flex items-center gap-2 px-2 py-2 rounded-[8px] hover:bg-[var(--surface-2)]"
          >
            <Avatar spec={user.avatar} photoUrl={user.avatarUrl} name={user.name} size={30} />
            <div className="min-w-0 flex-1">
              <div className="text-[12.5px] font-semibold truncate">{user.name}</div>
              <div className="text-[11px] truncate" style={{ color: "var(--text-3)" }}>
                {user.email}
              </div>
            </div>
          </Link>
          <LogoutButton />
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        <header
          className="sticky top-0 z-40 flex items-center gap-3 px-4 sm:px-5 h-[56px] sm:h-[60px]"
          style={{ background: "var(--surface-1)", borderBottom: "1px solid var(--border-1)" }}
        >
          <details className="lg:hidden">
            <summary className="list-none cursor-pointer px-2 py-1">☰</summary>
            <div
              className="absolute left-3 top-14 p-2 w-[220px] z-50"
              style={{ background: "var(--surface-1)", border: "1px solid var(--border-1)", borderRadius: 10 }}
            >
              {[["/dashboard", "Overview"], ["/employers/dashboard", "Pipeline"], ["/jobs", "Roles"], ["/employers/post", "Post"], ["/profile", "Account"]].map(([h, l]) => (
                <Link key={h} href={h} className="block px-3 py-2 text-[13.5px] hover:bg-[var(--surface-2)] rounded">
                  {l}
                </Link>
              ))}
            </div>
          </details>

          <div className="flex-1 min-w-0 max-w-[520px] 3xl:max-w-[720px] 4k:max-w-[900px]">
            <CmdkTrigger variant="bar" />
          </div>
          <div className="ml-auto flex items-center gap-2 shrink-0">
            <Link
              href="/employers/post"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[8px] text-[13px] font-semibold whitespace-nowrap"
              style={{ background: "var(--g)", color: "#fff" }}
            >
              <span className="sm:hidden">+ Role</span>
              <span className="hidden sm:inline">+ Post a role</span>
            </Link>
          </div>
        </header>
        <main className="flex-1 min-w-0 3xl:max-w-[2000px] 4k:max-w-[2400px] 3xl:mx-auto w-full">{children}</main>
      </div>
    </div>
  );
}
