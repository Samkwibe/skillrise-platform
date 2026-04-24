import Link from "next/link";
import type { User } from "@/lib/store";
import { Avatar } from "@/components/ui/avatar";
import { RoleStyler } from "@/components/theme/role-styler";
import { LogoutButton } from "@/components/logout-button";
import { CmdkTrigger } from "@/components/cmdk-trigger";

const PRIMARY: Array<{ href: string; label: string; icon: string }> = [
  { href: "/teach", label: "Dashboard", icon: "▤" },
  { href: "/teach/courses", label: "My courses", icon: "▦" },
  { href: "/teach/students", label: "Students", icon: "▩" },
  { href: "/teach/messages", label: "Inbox", icon: "✉" },
  { href: "/teach/quizzes", label: "Quizzes", icon: "▣" },
  { href: "/profile", label: "Settings", icon: "◆" },
];

const STUDIO: Array<{ href: string; label: string; icon: string }> = [
  { href: "/teach/record", label: "Record", icon: "●" },
  { href: "/teach/live", label: "Go live", icon: "▶" },
  { href: "/teach/ai", label: "AI assistant", icon: "✦" },
  { href: "/teach/impact", label: "Impact", icon: "▲" },
  { href: "/feed", label: "SkillFeed", icon: "◈" },
  { href: "/tracks", label: "Track catalog", icon: "○" },
];

const MOBILE_NAV = [...PRIMARY, ...STUDIO];

/**
 * Teacher shell — clear primary IA (dashboard + courses) with studio tools secondary.
 */
export function TeacherShell({ user, children }: { user: User; children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex" style={{ background: "var(--bg)", color: "var(--text-1)" }}>
      <RoleStyler role="teacher" />

      <aside
        className="hidden lg:flex flex-col w-[220px] 3xl:w-[256px] shrink-0 sticky top-0 h-screen overflow-y-auto"
        style={{ background: "var(--surface-1)", borderRight: "1px solid var(--border-1)" }}
      >
        <div className="px-4 py-4" style={{ borderBottom: "1px solid var(--border-1)" }}>
          <Link href="/teach" className="block">
            <div
              className="text-[15px] font-extrabold"
              style={{ fontFamily: "var(--role-font-display)", color: "var(--text-1)" }}
            >
              SkillRise
            </div>
            <div className="studio-label mt-0.5">Instructor</div>
          </Link>
        </div>

        <div className="px-3 py-3 flex items-center gap-2" style={{ borderBottom: "1px solid var(--border-1)" }}>
          <Avatar spec={user.avatar} size={34} />
          <div className="min-w-0 flex-1">
            <div className="text-[13px] font-semibold truncate">{user.name}</div>
            <div className="studio-label">Teacher</div>
          </div>
        </div>

        <nav className="flex flex-col gap-4 p-3 flex-1">
          <div>
            <div className="studio-label px-2 mb-1.5">Teach</div>
            <div className="flex flex-col gap-[2px]">
              {PRIMARY.map((i) => (
                <Link
                  key={i.href}
                  href={i.href}
                  className="flex items-center gap-3 px-2 py-2 rounded-[8px] text-[13px] hover:bg-[var(--surface-2)] transition-colors"
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
          <div>
            <div className="studio-label px-2 mb-1.5">Create &amp; connect</div>
            <div className="flex flex-col gap-[2px]">
              {STUDIO.map((i) => (
                <Link
                  key={i.href}
                  href={i.href}
                  className="flex items-center gap-3 px-2 py-2 rounded-[8px] text-[13px] hover:bg-[var(--surface-2)] transition-colors"
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
        </nav>

        <div className="p-3" style={{ borderTop: "1px solid var(--border-1)" }}>
          <Link
            href="/dashboard"
            className="block text-[12px] py-1.5 hover:underline"
            style={{ color: "var(--text-3)" }}
          >
            Learner home
          </Link>
          <Link href="/" className="block text-[12px] py-1.5 hover:underline" style={{ color: "var(--text-3)" }}>
            Marketing site
          </Link>
          <LogoutButton />
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        <header
          className="sticky top-0 z-40 flex items-center justify-between gap-2 px-3 sm:px-5 min-h-[56px] py-2"
          style={{
            background: "color-mix(in srgb, var(--surface-1) 92%, transparent)",
            backdropFilter: "blur(10px)",
            borderBottom: "1px solid var(--border-1)",
          }}
        >
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <details className="lg:hidden">
              <summary
                className="list-none cursor-pointer rounded-[8px] px-2.5 py-2 text-[15px] font-semibold"
                style={{ color: "var(--text-1)", background: "var(--surface-2)" }}
              >
                Menu
              </summary>
              <div
                className="absolute left-3 top-14 z-50 w-[min(100vw-24px,280px)] max-h-[min(70vh,480px)] overflow-y-auto rounded-[12px] p-2 shadow-lg"
                style={{ background: "var(--surface-1)", border: "1px solid var(--border-1)" }}
              >
                {MOBILE_NAV.map((i) => (
                  <Link
                    key={i.href}
                    href={i.href}
                    className="flex items-center gap-2 px-2 py-2.5 text-[13px] rounded-[8px] hover:bg-[var(--surface-2)]"
                    style={{ color: "var(--text-2)" }}
                  >
                    <span className="w-5 text-center" style={{ color: "var(--text-3)" }}>
                      {i.icon}
                    </span>
                    <span>{i.label}</span>
                  </Link>
                ))}
              </div>
            </details>
            <div className="min-w-0">
              <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--text-3)" }}>
                SkillRise
              </div>
              <div className="text-[12px] sm:text-[13px] truncate" style={{ color: "var(--text-2)" }}>
                {new Date().toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
              </div>
            </div>
          </div>

          <div className="hidden md:flex items-center flex-1 justify-center min-w-0 max-w-md px-2">
            <CmdkTrigger variant="bar" />
          </div>

          <Link
            href="/teach/live"
            className="inline-flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 rounded-[8px] font-bold text-[11px] sm:text-[12px] tracking-wide uppercase transition-transform active:scale-[0.98] shrink-0"
            style={{ background: "var(--red)", color: "#fff" }}
          >
            <span className="live-dot" style={{ background: "#fff" }} />
            <span>Go live</span>
          </Link>
        </header>
        <main className="flex-1 min-w-0 w-full">{children}</main>
      </div>
    </div>
  );
}
