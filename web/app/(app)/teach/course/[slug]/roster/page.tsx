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
    <div>
      <p className="text-sm mb-4" style={{ color: "var(--text-2)" }}>
        Learners currently enrolled. Progress is by lessons completed in this course.
      </p>
      <div className="overflow-x-auto rounded-[10px] border" style={{ borderColor: "var(--border-1)" }}>
        <table className="w-full min-w-[520px] text-left text-[13px]">
          <thead>
            <tr style={{ color: "var(--text-3)", borderBottom: "1px solid var(--border-1)" }}>
              <th className="py-3 pl-4 pr-2">Student</th>
              <th className="py-3 pr-2">Email</th>
              <th className="py-3 pr-2">Progress</th>
              <th className="py-3 pr-4">Section</th>
            </tr>
          </thead>
          <tbody>
            {students.length === 0 && (
              <tr>
                <td colSpan={4} className="py-6 pl-4 text-sm" style={{ color: "var(--text-3)" }}>
                  No students enrolled yet.
                </td>
              </tr>
            )}
            {students.map(({ user: s, enrollment: e }) => (
              <tr key={e.id} style={{ borderTop: "1px solid var(--border-1)" }}>
                <td className="py-3 pl-4 pr-2 font-medium" style={{ color: "var(--text-1)" }}>
                  {s.name}
                </td>
                <td className="py-3 pr-2" style={{ color: "var(--text-2)" }}>
                  {s.email}
                </td>
                <td className="py-3 pr-2 tabular-nums" style={{ color: "var(--text-2)" }}>
                  {pctDone(e, nMod)}%
                </td>
                <td className="py-3 pr-4" style={{ color: "var(--text-3)" }}>
                  {e.sectionId ? (sectionById.get(e.sectionId) ?? e.sectionId) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
