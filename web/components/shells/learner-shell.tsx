import Link from "next/link";
import type { User } from "@/lib/store";
import { userEnrollments, getTrack } from "@/lib/store";
import { Avatar } from "@/components/ui/avatar";
import { LogoutButton } from "@/components/logout-button";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { RoleStyler } from "@/components/theme/role-styler";
import { CmdkTrigger } from "@/components/cmdk-trigger";

/**
 * Learner shell — "Modern course platform" (Coursera / Brilliant feel).
 * Top horizontal nav, sticky "Resume where you left off" progress strip.
 * No left sidebar.
 */
export function LearnerShell({ user, children }: { user: User; children: React.ReactNode }) {
  const enrolls = userEnrollments(user.id);
  const resume = enrolls.find(
    (e) => (getTrack(e.trackSlug)?.modules.length ?? 0) > e.completedModuleIds.length,
  );
  const resumeTrack = resume ? getTrack(resume.trackSlug) : null;
  const resumeModule = resumeTrack?.modules.find(
    (m) => !resume!.completedModuleIds.includes(m.id),
  );
  const resumePct = resume && resumeTrack
    ? Math.round((resume.completedModuleIds.length / resumeTrack.modules.length) * 100)
    : 0;

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)", color: "var(--text-1)" }}>
      <RoleStyler role="learner" />
      <header
        className="sticky top-0 z-40 backdrop-blur-md"
        style={{
          background: "color-mix(in srgb, var(--surface-1) 92%, transparent)",
          borderBottom: "1px solid var(--border-1)",
        }}
      >
        <div className="dash-wrap flex items-center gap-3 sm:gap-5 h-[60px] md:h-[64px]">
          <Link href="/dashboard" className="flex items-center gap-2 shrink-0">
            <div
              className="w-9 h-9 rounded-[10px] flex items-center justify-center font-extrabold text-[18px]"
              style={{ background: "var(--g)", color: "var(--bg)", fontFamily: "var(--role-font-display)" }}
            >
              S
            </div>
            <div
              className="hidden sm:block font-extrabold text-[18px] tracking-tight"
              style={{ fontFamily: "var(--role-font-display)" }}
            >
              SkillRise<span style={{ color: "var(--g)" }}>.</span>
            </div>
          </Link>
          <nav className="hidden lg:flex items-center gap-1 flex-1 min-w-0 overflow-hidden">
            {[
              { href: "/dashboard", label: "My Learning" },
              { href: "/courses/search", label: "Free courses" },
              { href: "/tracks", label: "Browse Tracks" },
              { href: "/feed", label: "SkillFeed" },
              { href: "/community", label: "Community" },
              { href: "/live", label: "Live" },
              { href: "/assistant", label: "AI Tutor" },
              { href: "/jobs", label: "Jobs" },
            ].map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="px-3 py-2 rounded-[10px] text-[14px] font-medium hover:bg-[var(--surface-2)] transition-colors"
                style={{ color: "var(--text-2)" }}
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2 ml-auto">
            <CmdkTrigger className="hidden sm:inline-flex" />
            <ThemeToggle compact />
            <Link
              href="/profile"
              className="hidden sm:flex items-center gap-2 px-2 py-1.5 rounded-[10px] hover:bg-[var(--surface-2)]"
            >
              <Avatar spec={user.avatar} size={28} />
              <span className="text-[13px] font-semibold">{user.name.split(" ")[0]}</span>
            </Link>
            <details className="lg:hidden relative">
              <summary className="list-none cursor-pointer text-[22px] px-2">☰</summary>
              <div
                className="absolute right-0 top-10 card p-2 w-[240px] shadow-float z-50"
                style={{ background: "var(--surface-1)" }}
              >
                {[
                  ["/dashboard", "My Learning"],
                  ["/courses/search", "Free courses"],
                  ["/tracks", "Browse Tracks"],
                  ["/feed", "SkillFeed"],
                  ["/community", "Community"],
                  ["/live", "Live"],
                  ["/assistant", "AI Tutor"],
                  ["/jobs", "Jobs"],
                  ["/cert", "Certificates"],
                  ["/profile", "Profile"],
                ].map(([href, label]) => (
                  <Link key={href} href={href} className="block px-3 py-2 rounded text-[13.5px] hover:bg-[var(--surface-2)]">
                    {label}
                  </Link>
                ))}
                <div className="border-t mt-1 pt-1" style={{ borderColor: "var(--border-1)" }}>
                  <LogoutButton />
                </div>
              </div>
            </details>
            <div className="hidden lg:block">
              <LogoutButton />
            </div>
          </div>
        </div>

        {resume && resumeTrack && resumeModule && (
          <Link
            href={`/learn/${resumeTrack.slug}/${resumeModule.id}`}
            className="block dash-wrap pb-3 pt-1 group"
          >
            <div
              className="flex items-center gap-3 rounded-[14px] px-4 py-2.5"
              style={{ background: "var(--surface-2)", border: "1px solid var(--border-1)" }}
            >
              <div
                className="w-8 h-8 rounded-[10px] flex items-center justify-center text-[18px] shrink-0"
                style={{ background: `rgba(${resumeTrack.color},0.18)` }}
              >
                {resumeTrack.heroEmoji}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[11px] uppercase tracking-[0.12em] font-bold" style={{ color: "var(--text-3)" }}>
                  Resume where you left off
                </div>
                <div className="text-[14px] font-semibold truncate">
                  {resumeTrack.title} — {resumeModule.title}
                </div>
              </div>
              <div className="hidden sm:flex items-center gap-3 shrink-0">
                <div className="text-[12px] font-mono" style={{ color: "var(--text-2)" }}>
                  {resumePct}%
                </div>
                <span
                  className="px-3 py-1.5 rounded-full text-[12px] font-bold group-hover:translate-x-1 transition-transform"
                  style={{ background: "var(--g)", color: "var(--bg)" }}
                >
                  Continue →
                </span>
              </div>
            </div>
          </Link>
        )}
      </header>
      <main className="dash-wrap py-5 md:py-7 3xl:py-9">{children}</main>
    </div>
  );
}
