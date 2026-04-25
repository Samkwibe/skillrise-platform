import { notFound, redirect } from "next/navigation";
import { requireVerifiedUser } from "@/lib/auth";
import { getTrack } from "@/lib/store";
import { canTeacherEditCourse } from "@/lib/services/teacher-course";
import { getDb } from "@/lib/db";
import { ensureTracksFromDatabase } from "@/lib/course/ensure-tracks";
import { listStudentsForTrack } from "@/lib/services/lms-access";
import { buildGradebookForTrack } from "@/lib/services/lms-gradebook";

export const dynamic = "force-dynamic";

export default async function TeacherGradebookPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await requireVerifiedUser();
  if (user.role !== "teacher" && user.role !== "admin") redirect("/dashboard");
  await ensureTracksFromDatabase();
  const track = getTrack(slug);
  if (!canTeacherEditCourse(user, track) || !track) notFound();
  const db = getDb();
  await db.ready();
  const assignments = await db.listAssignmentsByTrack(slug);
  const students = await listStudentsForTrack(track);
  const rows = await buildGradebookForTrack(
    track,
    students.map((s) => ({ user: s.user, sectionId: s.enrollment.sectionId })),
    assignments,
  );
  return (
    <div className="w-full animate-in fade-in duration-500">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <span className="text-indigo-400 text-xl">💯</span>
          <h2 className="text-xl font-extrabold text-white">Gradebook</h2>
        </div>
        <a
          className="text-[11px] font-bold tracking-wide uppercase transition-colors px-3 py-1.5 rounded-md border flex items-center gap-2 text-indigo-300 hover:text-white bg-indigo-500/20 border-indigo-500/30 hover:bg-indigo-500/30"
          href={`/api/teacher/course/${encodeURIComponent(slug)}/gradebook?export=csv`}
        >
          ⬇ Export CSV
        </a>
      </div>
      <p className="text-sm text-t2 font-medium mb-6">
        Weights: assignments <span className="text-white font-bold">{track.gradebookWeights?.assignment ?? 50}%</span> · quizzes <span className="text-white font-bold">{track.gradebookWeights?.quiz ?? 50}%</span>.
      </p>

      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-md shadow-2xl">
        <table className="w-full text-left text-sm border-collapse min-w-[700px]">
          <thead>
            <tr className="border-b border-white/10 bg-black/20 text-t3 font-bold uppercase tracking-wider text-[11px]">
              <th className="py-4 pl-6 pr-4 rounded-tl-2xl sticky left-0 bg-[#0c0c14] z-10">Student</th>
              {assignments.map((a) => (
                <th key={a.id} className="py-4 pr-4 max-w-[120px] truncate" title={a.title}>
                  {a.title}
                </th>
              ))}
              <th className="py-4 pr-4">Final %</th>
              <th className="py-4 pr-6 rounded-tr-2xl">Letter</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {rows.map((r) => (
              <tr key={r.user.id} className="hover:bg-white/[0.04] transition-colors group">
                <td className="py-4 pl-6 pr-4 font-bold text-white group-hover:text-indigo-300 transition-colors flex items-center gap-3 sticky left-0 bg-[#0c0c14] group-hover:bg-[#12121a] z-10">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-[10px] font-bold text-white shadow-lg shrink-0">
                    {r.user.name.charAt(0)}
                  </div>
                  <span className="truncate">{r.user.name}</span>
                </td>
                {assignments.map((a) => {
                  const c = r.assignmentScores[a.id];
                  return (
                    <td key={a.id} className="py-4 pr-4 text-t2 tabular-nums">
                      {c ? (
                        <span className="bg-white/5 px-2 py-1 rounded-md text-white font-medium border border-white/5">
                          {c.score}<span className="text-t3 text-xs">/{c.max}</span>
                        </span>
                      ) : (
                        <span className="text-t3 opacity-50">—</span>
                      )}
                    </td>
                  );
                })}
                <td className="py-4 pr-4 tabular-nums font-bold text-white">
                  {r.finalPercent != null ? (
                    <span>{r.finalPercent.toFixed(1)}<span className="text-t3 text-xs ml-0.5">%</span></span>
                  ) : (
                    <span className="text-t3 opacity-50">—</span>
                  )}
                </td>
                <td className="py-4 pr-6">
                  {r.finalLetter ? (
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      ['A+', 'A', 'A-'].includes(r.finalLetter) ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                      ['B+', 'B', 'B-'].includes(r.finalLetter) ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                      ['C+', 'C', 'C-'].includes(r.finalLetter) ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                      'bg-red-500/20 text-red-400 border border-red-500/30'
                    }`}>
                      {r.finalLetter}
                    </span>
                  ) : (
                    <span className="text-t3 opacity-50">—</span>
                  )}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={assignments.length + 3} className="py-12 text-center text-t3 text-sm italic border-dashed border-white/5">
                  No graded students found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
