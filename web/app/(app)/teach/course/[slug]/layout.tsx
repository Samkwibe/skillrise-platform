import { notFound, redirect } from "next/navigation";
import { requireVerifiedUser } from "@/lib/auth";
import { getTrack } from "@/lib/store";
import { canTeacherEditCourse } from "@/lib/services/teacher-course";
import { ensureTracksFromDatabase } from "@/lib/course/ensure-tracks";
import { CoursePageHeader } from "@/components/teacher/course-page-header";

export const dynamic = "force-dynamic";

export default async function TeachCourseLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const user = await requireVerifiedUser();
  if (user.role !== "teacher" && user.role !== "admin") redirect("/dashboard");
  await ensureTracksFromDatabase();
  const track = getTrack(slug);
  if (!canTeacherEditCourse(user, track) || !track) notFound();

  return (
    <div className="section-pad-x py-6 sm:py-8 max-w-6xl mx-auto w-full">
      <CoursePageHeader slug={slug} title={track.title} heroEmoji={track.heroEmoji} color={track.color} />
      {children}
    </div>
  );
}
