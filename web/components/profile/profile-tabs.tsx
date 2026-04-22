import Link from "next/link";

type Tab = { id: string; label: string; href: string };

export type ProfileNavTab = "account" | "security" | "saved";

/** Account + Security for everyone; optional Saved tab for learners/teens. */
export function buildProfileNavTabs(opts: { canSave: boolean; savedCount: number }): { id: string; label: string; href: string }[] {
  const tabs: Tab[] = [
    { id: "account", label: "Account", href: "/profile" },
    { id: "security", label: "Security", href: "/profile/security" },
  ];
  if (opts.canSave) {
    tabs.push({
      id: "saved",
      label: `Saved lessons${opts.savedCount ? ` · ${opts.savedCount}` : ""}`,
      href: "/profile?tab=saved",
    });
  }
  return tabs;
}

/**
 * Server-rendered tab row for the profile page. Keeps things simple:
 * each tab is a real link, so state survives reloads and the URL is shareable.
 */
export function ProfileTabs({ tabs, active }: { tabs: Tab[]; active: string }) {
  return (
    <div
      role="tablist"
      className="flex flex-wrap gap-2 mb-6"
      style={{ borderBottom: "1px solid var(--border-1)", paddingBottom: 12 }}
    >
      {tabs.map((t) => {
        const isActive = t.id === active;
        return (
          <Link
            key={t.id}
            href={t.href}
            role="tab"
            aria-selected={isActive}
            className="px-4 py-2 rounded-full text-[13px] font-semibold transition-colors"
            style={{
              background: isActive ? "var(--g)" : "var(--surface-2)",
              color: isActive ? "var(--bg)" : "var(--text-1)",
              border: `1px solid ${isActive ? "var(--g)" : "var(--border-1)"}`,
            }}
          >
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}
