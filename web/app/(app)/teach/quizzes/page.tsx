import Link from "next/link";
import { requireVerifiedUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { TeacherQuizManager } from "@/components/teacher/teacher-quiz-manager";

export const dynamic = "force-dynamic";

export default async function TeacherQuizzesPage() {
  const user = await requireVerifiedUser();
  if (user.role !== "teacher" && user.role !== "admin") redirect("/dashboard");

  return (
    <div className="w-full text-t1 min-h-screen bg-gradient-to-br from-[#0a0a0f] to-[#12121a] pb-12">
      {/* Background Effect */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] bg-indigo-600/10 rounded-full blur-[120px] mix-blend-screen animate-pulse" style={{ animationDuration: '10s' }} />
      </div>

      <div className="max-w-[1600px] mx-auto relative z-10 px-4 sm:px-6 md:px-8 pt-8">
        <div className="mb-8">
          <Link href="/teach" className="inline-flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300 font-bold transition-colors bg-indigo-500/10 hover:bg-indigo-500/20 px-3 py-1.5 rounded-lg">
            <span>←</span> Back to Dashboard
          </Link>
        </div>
        
        <header className="mb-10">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-white via-white/90 to-white/60 bg-clip-text text-transparent mb-3">
            Video Quizzes
          </h1>
          <p className="text-t2 max-w-2xl text-sm leading-relaxed">
            Create interactive checkpoints and final exams linked directly to YouTube videos. Build engaging assessments and instantly preview how they will appear to your students.
          </p>
        </header>

        <TeacherQuizManager />
      </div>
    </div>
  );
}
