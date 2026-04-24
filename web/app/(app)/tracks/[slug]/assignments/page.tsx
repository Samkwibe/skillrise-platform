import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireVerifiedUser } from "@/lib/auth";
import { getTrack } from "@/lib/store";
import { getDb } from "@/lib/db";
import { ensureTracksFromDatabase } from "@/lib/course/ensure-tracks";
import { AssignmentSubmitForm } from "@/components/tracks/assignment-submit-form";

export const dynamic = "force-dynamic";

function fmt(d: number) {
  return new Date(d).toLocaleString();
}

export default async function CourseAssignmentsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await requireVerifiedUser();
  await ensureTracksFromDatabase();
  const track = getTrack(slug);
  if (!track) return notFound();
  const db = getDb();
  await db.ready();
  const e = await db.getEnrollment(user.id, slug);
  if (!e) redirect(`/tracks/${slug}`);
  if (e.pendingApproval) redirect(`/tracks/${slug}?pending=1`);
  const list = await db.listAssignmentsByTrack(slug);
  const mine = await db.listSubmissionsByUserTrack(user.id, slug);
  return (
    <div className="section-pad-x py-10 max-w-3xl">
      <Link href={`/tracks/${slug}`} className="text-[13px] text-t3 underline">
        ← {track.title}
      </Link>
      <h1 className="font-display text-2xl font-extrabold mt-2 mb-6">Assignments</h1>
      <div className="flex flex-col gap-3">
        {list.length === 0 && <p className="text-t2 text-sm">No assignments yet.</p>}
        {list.map((a) => {
          const s = mine.find((x) => x.assignmentId === a.id);
          const locked = s?.status === "graded" || s?.status === "returned";
          return (
            <div key={a.id} className="card p-4">
              <div className="font-semibold">{a.title}</div>
              <div className="text-[12px] text-t3">Due {fmt(a.dueAt)} · {a.pointsPossible} pts</div>
              {a.description && (
                <p className="text-t2 text-sm mt-2 whitespace-pre-wrap">{a.description}</p>
              )}
              {a.rubric && (
                <p className="text-t3 text-[12px] mt-2">
                  <span className="font-semibold text-t2">Rubric: </span>
                  {a.rubric}
                </p>
              )}
              {s && (
                <div className="text-[13px] text-t2 mt-2">
                  Status: {s.status}
                  {s.score != null && ` · ${s.score} / ${a.pointsPossible}`}
                  {s.feedback && (
                    <span className="block mt-1 text-t3">
                      Feedback: {s.feedback}
                    </span>
                  )}
                </div>
              )}
              <AssignmentSubmitForm
                trackSlug={slug}
                assignmentId={a.id}
                canEdit={!locked}
                initialText={s?.textBody}
                initialStatus={s?.status}
                initialFileKeys={s?.fileS3Keys}
              />
              {locked && s?.fileS3Keys && s.fileS3Keys.length > 0 && (
                <ul className="text-[12px] mt-2 text-t2 space-y-1">
                  {s.fileS3Keys.map((k) => (
                    <li key={k}>
                      <a
                        href={`/api/course/${encodeURIComponent(slug)}/assignment-file?key=${encodeURIComponent(k)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="underline text-g"
                      >
                        {k.split("/").pop() ?? "Attachment"}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
