import Link from "next/link";
import type { User } from "@/lib/store";
import { Avatar } from "@/components/ui/avatar";
import { RoleStyler } from "@/components/theme/role-styler";
import { LogoutButton } from "@/components/logout-button";

/**
 * Teen shell — "Gamified learning app" (Duolingo / BeReal energy).
 * Bottom tab bar. No sidebar. No theme toggle. No Jobs, no AI Tutor.
 * Explicitly removed: serious stat tiles, analytics charts, tables.
 */
const TEEN_TABS: Array<{ href: string; label: string; icon: string }> = [
  { href: "/dashboard", label: "Quest", icon: "⚔" },
  { href: "/tracks", label: "Learn", icon: "📚" },
  { href: "/discover", label: "Reels", icon: "🎬" },
  { href: "/feed", label: "Feed", icon: "◈" },
  { href: "/community", label: "Talk", icon: "◎" },
  { href: "/profile", label: "Me", icon: "★" },
];

export function TeenShell({ user, children }: { user: User; children: React.ReactNode }) {
  return (
    <div
      className="min-h-screen pb-24 md:pb-8"
      style={{
        background: "var(--bg)",
        color: "var(--text-1)",
        fontFamily: "var(--role-font-display)",
        backgroundImage:
          "radial-gradient(900px 500px at 20% -10%, color-mix(in srgb, var(--teen-purple) 25%, transparent), transparent 60%), radial-gradient(700px 400px at 100% 20%, color-mix(in srgb, var(--teen-pink) 18%, transparent), transparent 60%), radial-gradient(600px 400px at 50% 120%, color-mix(in srgb, var(--teen-lime) 14%, transparent), transparent 60%)",
      }}
    >
      <RoleStyler role="teen" />

      <header className="teen-wrap pt-5 sm:pt-6 pb-2 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-[18px] flex items-center justify-center font-black text-[22px]"
            style={{
              background: "var(--teen-lime)",
              color: "#140a28",
              transform: "rotate(-6deg)",
              boxShadow: "4px 4px 0 0 var(--teen-pink)",
            }}
          >
            S
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: "var(--teen-lime)" }}>
              Youth Zone
            </div>
            <div className="text-[22px] font-black leading-none">
              Hey {user.name.split(" ")[0]}!
            </div>
          </div>
        </div>
        <Link
          href="/profile"
          className="flex items-center gap-2 px-3 py-2 rounded-full"
          style={{
            background: "var(--surface-2)",
            border: "2px solid var(--teen-pink)",
          }}
        >
          <Avatar spec={user.avatar} photoUrl={user.avatarUrl} name={user.name} size={28} />
          {user.age && (
            <span className="text-[12px] font-extrabold" style={{ color: "var(--teen-lime)" }}>
              {user.age}
            </span>
          )}
        </Link>
      </header>

      <main className="teen-wrap pb-6">{children}</main>

      <nav
        className="fixed bottom-0 left-0 right-0 z-40 md:static md:teen-wrap md:mt-8 md:mb-4 md:rounded-[28px]"
        style={{
          background: "color-mix(in srgb, var(--surface-1) 94%, transparent)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          borderTop: "2px solid var(--border-2)",
        }}
      >
        <div className="flex items-center justify-around px-2 py-2 md:py-3 md:px-4 md:border-t-0 md:border md:border-[var(--border-2)] md:rounded-[28px]">
          {TEEN_TABS.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className="flex flex-col items-center gap-1 px-3 py-2 rounded-[16px] transition-transform active:scale-95"
            >
              <span
                className="text-[22px] leading-none"
                style={{ filter: "drop-shadow(0 2px 0 rgba(0,0,0,0.2))" }}
              >
                {t.icon}
              </span>
              <span className="text-[10px] font-black uppercase tracking-wider">{t.label}</span>
            </Link>
          ))}
        </div>
        <div className="hidden md:flex items-center justify-center px-4 py-2">
          <LogoutButton />
        </div>
      </nav>
      <div className="md:hidden fixed top-3 right-3 z-50">
        <div
          className="inline-flex rounded-full"
          style={{ background: "var(--surface-2)", border: "2px solid var(--teen-pink)" }}
        >
          <LogoutButton />
        </div>
      </div>
    </div>
  );
}
