import Link from "next/link";
import { requireVerifiedUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { TeacherQuizManager } from "@/components/teacher/teacher-quiz-manager";

export const dynamic = "force-dynamic";

export default async function TeacherQuizzesPage() {
  const user = await requireVerifiedUser();
  if (user.role !== "teacher" && user.role !== "admin") redirect("/dashboard");

  return (
    <div className="section-pad-x py-8 max-w-[900px] mx-auto">
      <div className="mb-4">
        <Link href="/teach" className="text-sm text-t2 underline">
          ← Dashboard
        </Link>
      </div>
      <PageHeader
        eyebrow="Teach"
        title="Video quizzes"
        subtitle="Create checkpoints and final exams for a course key + YouTube video. Learners will use these in the player (coming next), after you add quizzes here."
      />
      <TeacherQuizManager />
    </div>
  );
}
