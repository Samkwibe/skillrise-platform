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
    <div className="w-full text-t1 min-h-screen bg-gradient-to-br from-[#0a0a0f] to-[#12121a] pb-12 relative overflow-hidden">
      {/* Background Effect */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[10%] right-[20%] w-[40vw] h-[40vw] bg-indigo-600/10 rounded-full blur-[150px] mix-blend-screen animate-pulse" style={{ animationDuration: '15s' }} />
        <div className="absolute bottom-[10%] left-[10%] w-[30vw] h-[30vw] bg-purple-600/5 rounded-full blur-[150px] mix-blend-screen animate-pulse" style={{ animationDuration: '20s' }} />
      </div>

      <div className="max-w-[1400px] mx-auto relative z-10 px-4 sm:px-6 md:px-8 pt-8">
        <CoursePageHeader slug={slug} title={track.title} heroEmoji={track.heroEmoji} color={track.color} />
        {children}
      </div>
    </div>
  );
}
