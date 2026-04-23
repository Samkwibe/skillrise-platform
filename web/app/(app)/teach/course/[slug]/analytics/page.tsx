import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireVerifiedUser } from "@/lib/auth";
import { getTrack } from "@/lib/store";
import { canTeacherEditCourse } from "@/lib/services/teacher-course";
import { buildCourseAnalytics } from "@/lib/services/course-analytics";
import { ensureTracksFromDatabase } from "@/lib/course/ensure-tracks";

export const dynamic = "force-dynamic";

export default async function TeacherCourseAnalyticsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await requireVerifiedUser();
  if (user.role !== "teacher" && user.role !== "admin") redirect("/dashboard");
  await ensureTracksFromDatabase();
  const track = getTrack(slug);
  if (!canTeacherEditCourse(user, track) || !track) notFound();
  const data = await buildCourseAnalytics(track, user.id);
  return (
    <div className="section-pad-x py-8 max-w-3xl">
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
      </div>
      <h1 className="font-display text-2xl font-extrabold mb-2">Course analytics</h1>
      <p className="text-t2 text-sm mb-6">{data.title}</p>
      <div className="grid sm:grid-cols-2 gap-3 mb-8">
        <div className="card p-4">
          <div className="text-t3 text-[11px] uppercase">Enrolled</div>
          <div className="text-2xl font-bold">{data.enrollCount}</div>
        </div>
        <div className="card p-4">
          <div className="text-t3 text-[11px] uppercase">Graduated</div>
          <div className="text-2xl font-bold">{data.graduated}</div>
        </div>
        <div className="card p-4">
          <div className="text-t3 text-[11px] uppercase">Avg completion %</div>
          <div className="text-2xl font-bold">{data.avgTrackCompletion}</div>
        </div>
        <div className="card p-4">
          <div className="text-t3 text-[11px] uppercase">At-risk (heuristic)</div>
          <div className="text-2xl font-bold">{data.atRisk.length}</div>
        </div>
      </div>
      <h2 className="font-bold text-lg mb-2">Quizzes (avg best score per student)</h2>
      <ul className="text-sm text-t2 space-y-1 mb-8">
        {data.quizAverages.map((q) => (
          <li key={q.quizId}>
            {q.title}: {q.averagePct != null ? `${q.averagePct}%` : "—"}{" "}
            <span className="text-t3">({q.studentsWithScore} students)</span>
          </li>
        ))}
        {data.quizAverages.length === 0 && <li className="text-t3">No quizzes linked to this course key yet.</li>}
      </ul>
      <h2 className="font-bold text-lg mb-2">At-risk detail</h2>
      {data.atRisk.length === 0 && <p className="text-t2 text-sm">No flags for this class right now.</p>}
      <ul className="space-y-2">
        {data.atRisk.map((r) => (
          <li key={r.userId} className="card p-3 text-sm text-t2">
            <div className="font-semibold">{r.name}</div>
            <ul className="list-disc pl-4 mt-1">
              {r.reasons.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
}
