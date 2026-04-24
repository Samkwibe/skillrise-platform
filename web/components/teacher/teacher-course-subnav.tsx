"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs: { segment: string; label: string }[] = [
  { segment: "", label: "Overview" },
  { segment: "roster", label: "Roster" },
  { segment: "assignments", label: "Assignments" },
  { segment: "gradebook", label: "Gradebook" },
  { segment: "builder", label: "Content" },
  { segment: "analytics", label: "Analytics" },
  { segment: "materials", label: "Materials" },
];

export function TeacherCourseSubnav({ slug }: { slug: string }) {
  const pathname = usePathname();
  const base = `/teach/course/${encodeURIComponent(slug)}`;

  return (
    <div
      className="-mx-1 mb-6 overflow-x-auto pb-1"
      style={{ WebkitOverflowScrolling: "touch" }}
    >
      <nav
        className="inline-flex min-w-full gap-1 rounded-[10px] p-1 sm:flex-wrap"
        style={{ background: "var(--surface-2)", border: "1px solid var(--border-1)" }}
        aria-label="Course sections"
      >
        {tabs.map((t) => {
          const href = t.segment ? `${base}/${t.segment}` : base;
          const isOverview = t.segment === "";
          const active = isOverview ? pathname === base : pathname.startsWith(`${base}/${t.segment}`);
          return (
            <Link
              key={t.segment || "overview"}
              href={href}
              className={[
                "shrink-0 rounded-[8px] px-3 py-2 text-[13px] font-medium transition-colors",
                active
                  ? "text-white"
                  : "hover:bg-[color-mix(in_srgb,var(--surface-1)_70%,transparent)]",
              ].join(" ")}
              style={
                active
                  ? { background: "var(--red)", color: "#fff" }
                  : { color: "var(--text-2)" }
              }
            >
              {t.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
