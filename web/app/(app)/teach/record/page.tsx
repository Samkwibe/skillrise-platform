import Link from "next/link";
import { requireVerifiedUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { store } from "@/lib/store";
import { RecordLessonForm } from "@/components/record-lesson-form";

export const dynamic = "force-dynamic";

export default async function RecordLesson() {
  const user = await requireVerifiedUser();
  if (user.role !== "teacher" && user.role !== "admin") redirect("/dashboard");
  const myTracks = store.tracks.filter((t) => t.teacherId === user.id || user.role === "admin");

  return (
    <div className="w-full text-t1 min-h-screen bg-gradient-to-br from-[#0a0a0f] to-[#12121a] pb-12">
      {/* Background Effect */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[30%] right-[-10%] w-[50vw] h-[50vw] bg-fuchsia-600/5 rounded-full blur-[150px] mix-blend-screen animate-pulse" style={{ animationDuration: '18s' }} />
      </div>

      <div className="max-w-[1400px] mx-auto relative z-10 px-4 sm:px-6 md:px-8 pt-8">
        <div className="mb-6">
          <Link href="/teach" className="inline-flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300 font-bold transition-colors bg-white/5 hover:bg-white/10 border border-white/5 px-3 py-1.5 rounded-lg backdrop-blur-md">
            <span>←</span> Back to Dashboard
          </Link>
        </div>
        
        <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-fuchsia-500/10 border border-fuchsia-500/20 mb-3">
              <span className="w-2 h-2 rounded-full bg-fuchsia-400 animate-pulse"></span>
              <span className="text-[11px] font-bold uppercase tracking-wider text-fuchsia-400">Creator Studio</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-white via-white/90 to-white/60 bg-clip-text text-transparent mb-3">
              Record a Micro-Lesson
            </h1>
            <p className="text-t2 max-w-2xl text-sm leading-relaxed">
              Upload a vertical video directly to the SkillFeed. We automatically caption, translate, and publish. Use the algorithmic <strong className="text-white">Quality Checklist</strong> to ensure maximum engagement.
            </p>
          </div>
        </header>

        <RecordLessonForm tracks={myTracks.map((t) => ({ slug: t.slug, title: t.title }))} />
      </div>
    </div>
  );
}
