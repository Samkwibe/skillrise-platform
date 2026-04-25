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
      <div className="mb-3 flex flex-wrap items-center gap-2 text-[13px] text-t3">
        <Link
          href="/teach/courses"
          className="font-bold text-indigo-400 transition-colors hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 px-2 py-0.5 rounded-md"
        >
          Courses
        </Link>
        <span aria-hidden className="opacity-50">/</span>
        <span className="min-w-0 truncate text-t2 font-medium">{title}</span>
      </div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <div
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-2xl shadow-lg border border-white/10"
          style={{ background: `linear-gradient(135deg, rgba(${color},0.3) 0%, rgba(${color},0.1) 100%)` }}
        >
          {heroEmoji}
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-white/90 to-white/60 bg-clip-text text-transparent">
          {title}
        </h1>
      </div>
      <TeacherCourseSubnav slug={slug} />
    </header>
  );
}
