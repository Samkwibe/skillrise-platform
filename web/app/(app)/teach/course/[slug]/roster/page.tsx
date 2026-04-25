import { notFound, redirect } from "next/navigation";
import { requireVerifiedUser } from "@/lib/auth";
import { getTrack } from "@/lib/store";
import { canTeacherEditCourse } from "@/lib/services/teacher-course";
import { ensureTracksFromDatabase } from "@/lib/course/ensure-tracks";
import { listStudentsForTrack } from "@/lib/services/lms-access";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

function pctDone(enrolled: { completedModuleIds: string[] }, nModules: number) {
  if (nModules <= 0) return 0;
  return Math.round((enrolled.completedModuleIds.length / nModules) * 1000) / 10;
}

export default async function TeacherCourseRosterPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await requireVerifiedUser();
  if (user.role !== "teacher" && user.role !== "admin") redirect("/dashboard");
  await ensureTracksFromDatabase();
  const track = getTrack(slug);
  if (!canTeacherEditCourse(user, track) || !track) notFound();
  const students = await listStudentsForTrack(track);
  const db = getDb();
  await db.ready();
  const nMod = Math.max(1, track.modules.length);
  const sections = await db.listSectionsByTrack(slug);
  const sectionById = new Map(sections.map((s) => [s.id, s.label]));

  return (
    <div className="w-full animate-in fade-in duration-500">
      <div className="flex items-center gap-2 mb-6">
        <span className="text-indigo-400 text-xl">📋</span>
        <h2 className="text-xl font-extrabold text-white">Course Roster</h2>
      </div>
      <p className="text-sm mb-6 text-t2 font-medium">
        Learners currently enrolled. Progress is by lessons completed in this course.
      </p>
      
      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-md shadow-2xl">
        <table className="w-full min-w-[520px] text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-black/20 text-t3 font-bold uppercase tracking-wider text-[11px]">
              <th className="py-4 pl-6 pr-4 rounded-tl-2xl">Student</th>
              <th className="py-4 pr-4">Email</th>
              <th className="py-4 pr-4">Progress</th>
              <th className="py-4 pr-6 rounded-tr-2xl">Section</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {students.length === 0 && (
              <tr>
                <td colSpan={4} className="py-12 text-center text-t3 text-sm italic border-dashed border-white/5">
                  No students enrolled yet.
                </td>
              </tr>
            )}
            {students.map(({ user: s, enrollment: e }) => (
              <tr key={e.id} className="hover:bg-white/[0.04] transition-colors group">
                <td className="py-4 pl-6 pr-4 font-bold text-white group-hover:text-indigo-300 transition-colors flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-[10px] font-bold text-white shadow-lg">
                    {s.name.charAt(0)}
                  </div>
                  {s.name}
                </td>
                <td className="py-4 pr-4 text-t2">
                  {s.email}
                </td>
                <td className="py-4 pr-4">
                  <div className="flex items-center gap-3">
                    <span className="tabular-nums font-bold text-white w-12">{pctDone(e, nMod)}%</span>
                    <div className="w-24 h-1.5 bg-black/40 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-400 rounded-full" style={{ width: `${pctDone(e, nMod)}%` }}></div>
                    </div>
                  </div>
                </td>
                <td className="py-4 pr-6 text-t3">
                  <span className="px-2.5 py-1 bg-white/5 rounded-md text-[11px] font-bold uppercase tracking-wider">
                    {e.sectionId ? (sectionById.get(e.sectionId) ?? e.sectionId) : "General"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
