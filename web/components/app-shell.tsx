import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Avatar } from "@/components/ui/avatar";
import { LogoutButton } from "@/components/logout-button";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import type { Role } from "@/lib/store";

type NavItem = { href: string; label: string; icon: string; roles?: Role[]; group: string };

const ALL_NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: "🏠", group: "main" },
  { href: "/tracks", label: "Tracks", icon: "🧭", group: "main" },
  { href: "/feed", label: "SkillFeed", icon: "◈", group: "main" },
  { href: "/live", label: "Live", icon: "●", group: "main" },
  { href: "/assistant", label: "AI Tutor", icon: "🤖", group: "main", roles: ["learner", "teen", "teacher"] },
  { href: "/jobs", label: "Jobs", icon: "💼", group: "connect", roles: ["learner", "teacher", "teen"] },
  { href: "/cohort", label: "My Cohort", icon: "👥", group: "connect", roles: ["learner", "teen", "teacher"] },
  { href: "/challenge", label: "30-Day Challenge", icon: "🔥", group: "connect", roles: ["learner", "teen"] },
  { href: "/cert", label: "Certificates", icon: "🏅", group: "connect", roles: ["learner", "teen", "teacher"] },
  { href: "/teach", label: "Teach Studio", icon: "🎓", group: "work", roles: ["teacher", "admin"] },
  { href: "/teach/courses", label: "Courses", icon: "📚", group: "work", roles: ["teacher", "admin"] },
  { href: "/teach/quizzes", label: "Video quizzes", icon: "🧠", group: "work", roles: ["teacher", "admin"] },
  { href: "/teach/ai", label: "AI assistant", icon: "✨", group: "work", roles: ["teacher", "admin"] },
  { href: "/teach/students", label: "Student success", icon: "🛟", group: "work", roles: ["teacher", "admin"] },
  { href: "/teach/impact", label: "Community impact", icon: "📈", group: "work", roles: ["teacher", "admin"] },
  { href: "/employers/dashboard", label: "Employer Hub", icon: "🏢", group: "work", roles: ["employer", "admin"] },
  { href: "/employers/post", label: "Post a job", icon: "➕", group: "work", roles: ["employer", "admin"] },
  { href: "/schools/dashboard", label: "School Dashboard", icon: "🏫", group: "work", roles: ["school", "admin"] },
  { href: "/admin", label: "Admin", icon: "⚙", group: "work", roles: ["admin"] },
  { href: "/profile", label: "Profile", icon: "👤", group: "account" },
];

const GROUP_LABELS: Record<string, string> = {
  main: "Learn",
  connect: "Connect",
  work: "Work",
  account: "Account",
};

export async function AppShell({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const items = ALL_NAV.filter((n) => !n.roles || n.roles.includes(user.role));
  const groups = items.reduce<Record<string, NavItem[]>>((acc, i) => {
    acc[i.group] = acc[i.group] || [];
    acc[i.group].push(i);
    return acc;
  }, {});

  return (
    <div className="min-h-screen flex bg-ink text-t1">
      <aside className="hidden md:flex flex-col w-[260px] shrink-0 border-r border-border1 p-4 gap-1 sticky top-0 h-screen overflow-y-auto bg-s1">
        <Link href="/dashboard" className="px-2 py-3 block">
          <div className="font-display text-[20px] font-extrabold text-g">
            Skill<span className="text-t1">Rise</span>
          </div>
          <div className="text-[11px] text-t3 italic">Learn. Teach. Rise.</div>
        </Link>
        <div className="flex items-center gap-3 px-2 py-3 mb-2 border-y border-border1">
          <Avatar spec={user.avatar} photoUrl={user.avatarUrl} name={user.name} size={36} />
          <div className="min-w-0 flex-1">
            <div className="text-[13px] font-semibold truncate">{user.name}</div>
            <div className="text-[11px] text-t3 capitalize">{user.role}</div>
          </div>
        </div>
        <nav className="flex flex-col gap-3">
          {Object.entries(groups).map(([group, list]) => (
            <div key={group} className="flex flex-col gap-[2px]">
              <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-t3 px-3 py-1">
                {GROUP_LABELS[group] ?? group}
              </div>
              {list.map((i) => (
                <Link
                  key={i.href}
                  href={i.href}
                  className="flex items-center gap-3 px-3 py-[9px] rounded-[10px] text-[13.5px] text-t2 hover:text-t1 hover:bg-s2 transition-colors micro-hover"
                >
                  <span className="w-5 text-center">{i.icon}</span>
                  <span>{i.label}</span>
                </Link>
              ))}
            </div>
          ))}
        </nav>
        <div className="mt-auto pt-3 border-t border-border1 flex flex-col gap-2">
          <div className="flex items-center justify-between px-3">
            <span className="text-[11px] text-t3 uppercase tracking-wider font-bold">Theme</span>
            <ThemeToggle compact />
          </div>
          <Link href="/" className="text-[12px] text-t3 px-3 py-[7px] hover:text-t1">
            ← Back to homepage
          </Link>
          <LogoutButton />
        </div>
      </aside>
      <div className="md:hidden sticky top-0 z-40 w-full glass border-b border-border1 flex items-center justify-between px-4 h-[56px]">
        <Link href="/dashboard" className="font-display font-extrabold text-g">
          Skill<span className="text-t1">Rise</span>
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle compact />
          <details className="relative">
            <summary className="list-none cursor-pointer p-1 text-[22px]">☰</summary>
            <div className="absolute right-0 top-10 w-[260px] card p-2 shadow-float max-h-[70vh] overflow-y-auto">
              {Object.entries(groups).map(([group, list]) => (
                <div key={group} className="mb-2">
                  <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-t3 px-3 py-1">
                    {GROUP_LABELS[group] ?? group}
                  </div>
                  {list.map((i) => (
                    <Link
                      key={i.href}
                      href={i.href}
                      className="flex items-center gap-3 px-3 py-2 rounded-[8px] text-[13.5px] text-t2 hover:text-t1 hover:bg-s2"
                    >
                      <span className="w-5 text-center">{i.icon}</span>
                      <span>{i.label}</span>
                    </Link>
                  ))}
                </div>
              ))}
              <div className="border-t border-border1 mt-1 pt-1">
                <LogoutButton />
              </div>
            </div>
          </details>
        </div>
      </div>
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}
