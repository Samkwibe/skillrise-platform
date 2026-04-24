import Link from "next/link";
import { TeacherCourseSubnav } from "./teacher-course-subnav";

type Props = {
  slug: string;
  title: string;
  heroEmoji: string;
  color: string;
};

/**
 * Breadcrumb + course title + tabbed subnav for all `/teach/course/[slug]/*` pages.
 */
export function CoursePageHeader({ slug, title, heroEmoji, color }: Props) {
  return (
    <header className="mb-2">
      <div className="mb-3 flex flex-wrap items-center gap-2 text-[13px]" style={{ color: "var(--text-3)" }}>
        <Link
          href="/teach/courses"
          className="font-medium transition-colors hover:underline"
          style={{ color: "var(--text-2)" }}
        >
          My courses
        </Link>
        <span aria-hidden>→</span>
        <span className="min-w-0 truncate">{title}</span>
      </div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[12px] text-[24px]"
          style={{ background: `rgba(${color},0.2)` }}
        >
          {heroEmoji}
        </div>
        <h1
          className="font-[family-name:var(--role-font-display)] text-[clamp(1.25rem,3vw,1.75rem)] font-extrabold leading-tight"
          style={{ color: "var(--text-1)" }}
        >
          {title}
        </h1>
      </div>
      <TeacherCourseSubnav slug={slug} />
    </header>
  );
}
