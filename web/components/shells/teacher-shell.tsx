import Link from "next/link";
import type { User } from "@/lib/store";
import { Avatar } from "@/components/ui/avatar";
import { RoleStyler } from "@/components/theme/role-styler";
import { LogoutButton } from "@/components/logout-button";
import { CmdkTrigger } from "@/components/cmdk-trigger";

/**
 * Teacher shell — "Instructor studio" (OBS / Loom Creator feel).
 * Left studio rail, persistent top bar with ● Go Live button, broadcast-dark.
 * Metadata uses monospace; everything is dense and rectangular.
 */
const STUDIO_NAV: Array<{ group: string; items: Array<{ href: string; label: string; icon: string }> }> = [
  {
    group: "Studio",
    items: [
      { href: "/dashboard", label: "Overview", icon: "▤" },
      { href: "/teach", label: "Teach Studio", icon: "◈" },
      { href: "/teach/record", label: "Record", icon: "●" },
      { href: "/teach/live", label: "Schedule Live", icon: "▶" },
    ],
  },
  {
    group: "Content",
    items: [
      { href: "/feed", label: "My Lessons", icon: "▦" },
      { href: "/tracks", label: "Tracks", icon: "△" },
      { href: "/live", label: "Sessions", icon: "◉" },
      { href: "/community", label: "Office Hours", icon: "◎" },
    ],
  },
  {
    group: "Support",
    items: [
      { href: "/assistant", label: "AI Assistant", icon: "⚙" },
      { href: "/cohort", label: "Cohorts", icon: "▩" },
      { href: "/profile", label: "Account", icon: "◆" },
    ],
  },
];

export function TeacherShell({ user, children }: { user: User; children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex" style={{ background: "var(--bg)", color: "var(--text-1)" }}>
      <RoleStyler role="teacher" />

      <aside
        className="hidden lg:flex flex-col w-[220px] 3xl:w-[260px] 4k:w-[300px] shrink-0 sticky top-0 h-screen overflow-y-auto"
        style={{ background: "var(--surface-1)", borderRight: "1px solid var(--border-1)" }}
      >
        <div className="px-4 py-5" style={{ borderBottom: "1px solid var(--border-1)" }}>
          <div
            className="flex items-center gap-2 text-[13px] font-bold"
            style={{ fontFamily: "var(--role-font-display)", letterSpacing: "0.1em" }}
          >
            <span className="live-dot" />
            <span style={{ color: "var(--red)" }}>SR STUDIO</span>
          </div>
          <div className="studio-label mt-1">Instructor workstation</div>
        </div>

        <div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom: "1px solid var(--border-1)" }}>
          <Avatar spec={user.avatar} size={34} />
          <div className="min-w-0 flex-1">
            <div className="text-[13px] font-semibold truncate">{user.name}</div>
            <div className="studio-label">
              {user.credentials ? user.credentials.slice(0, 22) : "Teacher"}
            </div>
          </div>
        </div>

        <nav className="flex flex-col gap-3 p-3 flex-1">
          {STUDIO_NAV.map((g) => (
            <div key={g.group}>
              <div className="studio-label px-2 mb-1">{g.group}</div>
              <div className="flex flex-col gap-[2px]">
                {g.items.map((i) => (
                  <Link
                    key={i.href}
                    href={i.href}
                    className="flex items-center gap-3 px-2 py-2 rounded-[6px] text-[13px] hover:bg-[var(--surface-2)] transition-colors"
                    style={{ color: "var(--text-2)" }}
                  >
                    <span className="w-5 text-center studio-metric" style={{ color: "var(--text-3)" }}>
                      {i.icon}
                    </span>
                    <span>{i.label}</span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-3" style={{ borderTop: "1px solid var(--border-1)" }}>
          <Link
            href="/"
            className="block text-[11px] studio-label py-1 hover:underline"
            style={{ color: "var(--text-3)" }}
          >
            ← Exit studio
          </Link>
          <LogoutButton />
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        <header
          className="sticky top-0 z-40 flex items-center justify-between px-5 h-[56px]"
          style={{
            background: "color-mix(in srgb, var(--surface-1) 92%, transparent)",
            backdropFilter: "blur(10px)",
            borderBottom: "1px solid var(--border-1)",
          }}
        >
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <details className="lg:hidden">
              <summary className="list-none cursor-pointer px-2 py-1 studio-metric text-[18px]">≡</summary>
              <div
                className="absolute left-3 top-14 card p-2 w-[240px] z-50"
                style={{ background: "var(--surface-1)", border: "1px solid var(--border-1)" }}
              >
                {STUDIO_NAV.flatMap((g) => g.items).map((i) => (
                  <Link key={i.href} href={i.href} className="flex items-center gap-2 px-2 py-2 text-[13px] hover:bg-[var(--surface-2)] rounded">
                    <span className="studio-metric" style={{ color: "var(--text-3)" }}>{i.icon}</span>
                    <span>{i.label}</span>
                  </Link>
                ))}
              </div>
            </details>
            <div className="studio-label hidden sm:block">SESSION</div>
            <div className="studio-metric text-[13px] truncate" style={{ color: "var(--text-2)" }}>
              {new Date().toISOString().slice(0, 10)} · idle
            </div>
          </div>

          <div className="hidden md:flex items-center gap-3 flex-1 justify-center max-w-[360px] 3xl:max-w-[520px] 4k:max-w-[720px] px-4">
            <CmdkTrigger variant="bar" />
          </div>

          <Link
            href="/teach/live"
            className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-[6px] font-bold text-[12px] sm:text-[13px] tracking-wide uppercase transition-transform hover:scale-[1.02] shrink-0"
            style={{ background: "var(--red)", color: "#fff" }}
          >
            <span className="live-dot" style={{ background: "#fff" }} />
            <span className="hidden xs:inline">Go Live</span>
            <span className="xs:hidden">Live</span>
          </Link>
        </header>
        <main className="flex-1 min-w-0 3xl:max-w-[1920px] 4k:max-w-[2400px] 3xl:mx-auto w-full">{children}</main>
      </div>
    </div>
  );
}
