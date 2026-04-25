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
    <div className="w-full animate-in fade-in duration-500">
      <div className="flex items-center gap-2 mb-6">
        <span className="text-indigo-400 text-xl">🏗️</span>
        <h2 className="text-xl font-extrabold text-white">Course Builder</h2>
      </div>
      <p className="text-sm text-t2 font-medium mb-8 max-w-2xl bg-white/5 p-4 rounded-xl border border-white/5 backdrop-blur-md">
        <strong className="text-white">Pro Tip:</strong> Drag lessons between modules where drop zones appear. Upload video to S3 when configured, or use YouTube and links. Save often.
      </p>
      <CourseBuilder trackSlug={track.slug} />
    </div>
  );
}
