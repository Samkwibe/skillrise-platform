import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireVerifiedUser } from "@/lib/auth";
import { getTrack } from "@/lib/store";
import { getDb } from "@/lib/db";
import { ensureTracksFromDatabase } from "@/lib/course/ensure-tracks";
import { MessageComposer } from "./message-composer";

export const dynamic = "force-dynamic";

export default async function CourseMessagesPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const threadQ = typeof sp?.thread === "string" ? sp.thread : undefined;
  const user = await requireVerifiedUser();
  await ensureTracksFromDatabase();
  const track = getTrack(slug);
  if (!track) return notFound();
  const db = getDb();
  await db.ready();
  const e = await db.getEnrollment(user.id, slug);
  const isTeach = user.id === track.teacherId;
  if (!e && !isTeach) redirect(`/tracks/${slug}`);
  if (e?.pendingApproval && !isTeach) redirect(`/tracks/${slug}?pending=1`);
  const threads = await db.listDmThreadsForUser(user.id, slug);
  const activeId = threadQ && threads.some((t) => t.id === threadQ) ? threadQ : threads[0]?.id;
  const messages = activeId ? await db.listDmMessages(activeId) : [];
  return (
    <div className="section-pad-x py-10 max-w-3xl">
      <Link href={`/tracks/${slug}`} className="text-[13px] text-t3 underline">
        ← {track.title}
      </Link>
      <h1 className="font-display text-2xl font-extrabold mt-2 mb-4">Messages</h1>
      <p className="text-t2 text-sm mb-4">Messages go between you and the course instructor only.</p>
      <div className="grid md:grid-cols-[200px_1fr] gap-4">
        <ul className="text-sm">
          {threads.length === 0 && <li className="text-t3">No threads yet.</li>}
          {threads.map((t) => {
            const other = t.teacherId === user.id ? t.studentId : t.teacherId;
            return (
              <li key={t.id}>
                <Link
                  href={`/tracks/${slug}/messages?thread=${encodeURIComponent(t.id)}`}
                  className={`block p-2 rounded ${activeId === t.id ? "bg-white/10" : "hover:bg-white/5"}`}
                >
                  {other === track.teacherId ? "Instructor" : "Student"}
                </Link>
              </li>
            );
          })}
        </ul>
        <div className="space-y-2 min-h-[200px]">
          {messages.map((m) => (
            <div key={m.id} className="card p-2 text-sm text-t2 whitespace-pre-wrap">
              {m.body}
            </div>
          ))}
        </div>
      </div>
      <div className="mt-6">
        <MessageComposer trackSlug={slug} isTeacher={isTeach} />
      </div>
    </div>
  );
}
