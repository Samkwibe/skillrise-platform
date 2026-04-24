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
    <div className="max-w-5xl w-full overflow-x-auto">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm" style={{ color: "var(--text-2)" }}>
          Weights: assignments {track.gradebookWeights?.assignment ?? 50}% · quizzes {track.gradebookWeights?.quiz ?? 50}%.
        </p>
        <a
          className="text-sm font-medium underline"
          style={{ color: "var(--text-2)" }}
          href={`/api/teacher/course/${encodeURIComponent(slug)}/gradebook?export=csv`}
        >
          Export CSV
        </a>
      </div>
      <h2 className="font-[family-name:var(--role-font-display)] text-xl font-extrabold mb-3" style={{ color: "var(--text-1)" }}>
        Gradebook
      </h2>
      <table className="w-full text-left text-[13px] border-collapse">
        <thead>
          <tr className="text-t3 border-b border-white/10">
            <th className="py-2 pr-3">Student</th>
            {assignments.map((a) => (
              <th key={a.id} className="py-2 pr-2 max-w-[120px]">
                {a.title}
              </th>
            ))}
            <th className="py-2 pr-2">Final %</th>
            <th className="py-2">Letter</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.user.id} className="border-b border-white/5">
              <td className="py-2 pr-3 text-t1">{r.user.name}</td>
              {assignments.map((a) => {
                const c = r.assignmentScores[a.id];
                return (
                  <td key={a.id} className="py-2 pr-2 text-t2">
                    {c ? `${c.score}/${c.max}` : "—"}
                  </td>
                );
              })}
              <td className="py-2 pr-2">{r.finalPercent != null ? r.finalPercent.toFixed(1) : "—"}</td>
              <td className="py-2">{r.finalLetter}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
