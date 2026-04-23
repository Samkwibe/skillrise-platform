import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireVerifiedUser } from "@/lib/auth";
import { getTrack } from "@/lib/store";
import { canTeacherEditCourse } from "@/lib/services/teacher-course";
import { ensureTracksFromDatabase } from "@/lib/course/ensure-tracks";
import { PageHeader } from "@/components/page-header";
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
    <div className="section-pad-x py-8 max-w-4xl mx-auto">
      <div className="text-sm text-t2 mb-4 flex flex-wrap gap-3">
        <Link href="/teach/courses" className="underline">
          ← All courses
        </Link>
        <Link href={`/teach/course/${slug}/builder`} className="underline">
          Builder
        </Link>
        <Link href={`/teach/course/${slug}/gradebook`} className="underline">
          Gradebook
        </Link>
        <Link href={`/teach/course/${slug}/analytics`} className="underline">
          Analytics
        </Link>
      </div>
      <PageHeader
        eyebrow="Assignments"
        title={track.title}
        subtitle="Create assignments and grade submissions. Students open Assignments from the course page."
      />
      <TeacherAssignmentManager trackSlug={slug} />
    </div>
  );
}
