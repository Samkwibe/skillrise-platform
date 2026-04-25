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
        className="inline-flex min-w-full gap-2 rounded-xl p-1.5 sm:flex-wrap bg-black/20 border border-white/5 backdrop-blur-md"
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
                "shrink-0 rounded-lg px-4 py-2 text-[13px] font-bold transition-all duration-300",
                active
                  ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shadow-[0_0_10px_rgba(99,102,241,0.2)]"
                  : "text-t3 hover:text-white hover:bg-white/5 border border-transparent",
              ].join(" ")}
            >
              {t.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
