import { notFound, redirect } from "next/navigation";
import { requireVerifiedUser } from "@/lib/auth";
import { getTrack } from "@/lib/store";
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
    <div className="max-w-[960px]">
      <p className="text-sm mb-6" style={{ color: "var(--text-2)" }}>
        Drag lessons between modules where drop zones appear. Upload video to S3 when configured, or use YouTube and links. Save often.
      </p>
      <CourseBuilder trackSlug={track.slug} />
    </div>
  );
}
