import { notFound, redirect } from "next/navigation";
import { requireVerifiedUser } from "@/lib/auth";
import { getTrack } from "@/lib/store";
import { canTeacherEditCourse } from "@/lib/services/teacher-course";
import { ensureTracksFromDatabase } from "@/lib/course/ensure-tracks";
import { TeacherAssignmentManager } from "@/components/teacher/teacher-assignment-manager";

export const dynamic = "force-dynamic";

export default async function TeacherAssignmentsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await requireVerifiedUser();
  if (user.role !== "teacher" && user.role !== "admin") redirect("/dashboard");
  await ensureTracksFromDatabase();
  const track = getTrack(slug);
  if (!canTeacherEditCourse(user, track) || !track) notFound();

  return (
    <div className="w-full animate-in fade-in duration-500">
      <div className="flex items-center gap-2 mb-6">
        <span className="text-indigo-400 text-xl">📝</span>
        <h2 className="text-xl font-extrabold text-white">Grading Desk</h2>
      </div>
      <p className="text-sm text-t2 font-medium mb-8 max-w-2xl bg-white/5 p-4 rounded-xl border border-white/5 backdrop-blur-md">
        Create assignments and grade submissions. Students open assignments from the course page. Use the AI Grading Assistant to pre-fill feedback for standard criteria.
      </p>
      <TeacherAssignmentManager trackSlug={slug} />
    </div>
  );
}
