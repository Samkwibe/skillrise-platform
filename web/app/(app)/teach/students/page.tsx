import Link from "next/link";
import { requireVerifiedUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AtRiskStudentPanel } from "@/components/teacher/at-risk-student-panel";

export const dynamic = "force-dynamic";

export default async function TeacherStudentsPage() {
  const user = await requireVerifiedUser();
  if (user.role !== "teacher" && user.role !== "admin") redirect("/dashboard");

  return (
    <div className="w-full text-t1 min-h-screen bg-gradient-to-br from-[#0a0a0f] to-[#12121a] pb-12">
      {/* Background Effect */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[40vw] h-[40vw] bg-red-600/5 rounded-full blur-[120px] mix-blend-screen animate-pulse" style={{ animationDuration: '14s' }} />
      </div>

      <div className="max-w-[1600px] mx-auto relative z-10 px-4 sm:px-6 md:px-8 pt-8">
        <div className="mb-6">
          <Link href="/teach" className="inline-flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300 font-bold transition-colors bg-white/5 hover:bg-white/10 border border-white/5 px-3 py-1.5 rounded-lg backdrop-blur-md">
            <span>←</span> Back to Dashboard
          </Link>
        </div>
        
        <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 mb-3">
              <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse"></span>
              <span className="text-[11px] font-bold uppercase tracking-wider text-red-400">Student Success</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-white via-white/90 to-white/60 bg-clip-text text-transparent mb-3">
              Student Command Center
            </h1>
            <p className="text-t2 max-w-2xl text-sm leading-relaxed">
              Algorithmic detection of learners who may need a nudge. We calculate a <strong className="text-white">Risk Score</strong> based on progress, recent activity, and quiz performance so you can intervene early.
            </p>
          </div>
        </header>

        <AtRiskStudentPanel />
      </div>
    </div>
  );
}
