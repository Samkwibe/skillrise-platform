import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireVerifiedUser } from "@/lib/auth";
import { getTrack } from "@/lib/store";
import { canTeacherEditCourse } from "@/lib/services/teacher-course";
import { ensureTracksFromDatabase } from "@/lib/course/ensure-tracks";
import type { CourseMaterial, Module } from "@/lib/store";

export const dynamic = "force-dynamic";

function MaterialRow({ m }: { m: CourseMaterial }) {
  const label = m.kind === "link" || m.kind === "youtube" ? "Open" : "File";
  const icon = m.kind === "youtube" ? "📺" : m.kind === "link" ? "🔗" : "📄";
  return (
    <li className="flex flex-wrap items-center justify-between gap-3 text-sm py-3 px-4 hover:bg-white/[0.04] transition-colors group">
      <div className="flex items-center gap-3">
        <span className="text-lg opacity-70 group-hover:opacity-100 transition-opacity">{icon}</span>
        <span className="text-t1 font-medium group-hover:text-white transition-colors">{m.title}</span>
      </div>
      <span className="text-[11px] uppercase tracking-wider text-t3 px-2 py-1 bg-white/5 rounded border border-white/5 group-hover:bg-indigo-500/10 group-hover:text-indigo-300 group-hover:border-indigo-500/20 transition-all">
        {m.kind}
      </span>
    </li>
  );
}

function ModuleMaterials({ mod }: { mod: Module }) {
  const list = mod.materials?.length ? mod.materials : [];
  return (
    <div className="mb-4 rounded-2xl bg-white/[0.02] border border-white/10 backdrop-blur-md overflow-hidden">
      <div className="p-4 bg-black/20 border-b border-white/5 flex items-center gap-2">
        <span className="text-indigo-400">📚</span>
        <h3 className="font-bold text-white text-sm">
          {mod.title}
        </h3>
      </div>
      {list.length === 0 ? (
        <div className="p-6 text-center text-sm text-t3 italic border-dashed border-white/5">
          No files or links in this lesson yet. Add them in the course builder.
        </div>
      ) : (
        <ul className="divide-y divide-white/5">
          {list.map((m) => (
            <MaterialRow key={m.id} m={m} />
          ))}
        </ul>
      )}
    </div>
  );
}

export default async function TeacherCourseMaterialsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await requireVerifiedUser();
  if (user.role !== "teacher" && user.role !== "admin") redirect("/dashboard");
  await ensureTracksFromDatabase();
  const track = getTrack(slug);
  if (!canTeacherEditCourse(user, track) || !track) notFound();
  const withMaterials = track.modules.filter((m) => (m.materials?.length ?? 0) > 0).length;

  return (
    <div className="w-full animate-in fade-in duration-500 max-w-4xl">
      <div className="flex items-center gap-2 mb-6">
        <span className="text-indigo-400 text-xl">🗂️</span>
        <h2 className="text-xl font-extrabold text-white">Course Materials</h2>
      </div>
      <p className="text-sm text-t2 font-medium mb-8">
        Files and links attached to each lesson. Edit lessons in{" "}
        <Link href={`/teach/course/${encodeURIComponent(slug)}/builder`} className="text-indigo-400 hover:text-indigo-300 font-bold bg-indigo-500/10 hover:bg-indigo-500/20 px-2 py-0.5 rounded transition-colors">
          Content
        </Link>{" "}
        to add PDFs, uploads, and URLs.
      </p>
      {withMaterials === 0 && (
        <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/5 backdrop-blur-md text-center">
          <div className="text-4xl mb-3 opacity-50">📂</div>
          <p className="text-sm text-t2 mb-6 font-medium">
            No lesson materials on file for this course yet.
          </p>
          <Link 
            href={`/teach/course/${encodeURIComponent(slug)}/builder`} 
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg bg-indigo-500/20 text-indigo-300 hover:text-white hover:bg-indigo-500/30 border border-indigo-500/30"
          >
            <span>🏗️</span> Open course builder
          </Link>
        </div>
      )}
      <div className="space-y-4">
        {track.modules.map((mod) => (
          <ModuleMaterials key={mod.id} mod={mod} />
        ))}
      </div>
    </div>
  );
}
