import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireVerifiedUser } from "@/lib/auth";
import { getTrack } from "@/lib/store";
import { PageHeader } from "@/components/page-header";
import { CourseBuilder } from "@/components/teacher/course-builder";
import { canTeacherEditCourse } from "@/lib/services/teacher-course";

export const dynamic = "force-dynamic";

export default async function CourseBuilderPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await requireVerifiedUser();
  if (user.role !== "teacher" && user.role !== "admin") redirect("/dashboard");

  const track = getTrack(slug);
  if (!canTeacherEditCourse(user, track) || !track) notFound();

  return (
    <div className="section-pad-x py-8 max-w-[960px] mx-auto">
      <div className="mb-4 flex flex-wrap gap-3 text-sm text-t2">
        <Link href="/teach/courses" className="underline">
          ← All courses
        </Link>
        <Link href="/teach" className="underline">
          Teach Studio
        </Link>
        <Link href={`/teach/course/${slug}/gradebook`} className="underline">
          Gradebook
        </Link>
        <Link href={`/teach/course/${slug}/analytics`} className="underline">
          Analytics
        </Link>
      </div>
      <PageHeader
        eyebrow="Course builder"
        title={track.title}
        subtitle="Drag-and-drop is supported between modules (see drop zones). Upload MP4 / MOV / WebM to your S3 bucket, or use YouTube and external links. Save often."
      />
      <CourseBuilder trackSlug={track.slug} />
    </div>
  );
}
