import Link from "next/link";
import { redirect } from "next/navigation";
import { requireVerifiedUser } from "@/lib/auth";
import { getTrack } from "@/lib/store";
import { getDb } from "@/lib/db";
import { ensureTracksFromDatabase } from "@/lib/course/ensure-tracks";

export const dynamic = "force-dynamic";

function fmtTime(at: number) {
  return new Date(at).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export default async function TeacherInboxPage() {
  const user = await requireVerifiedUser();
  if (user.role !== "teacher" && user.role !== "admin") redirect("/dashboard");
  await ensureTracksFromDatabase();
  const db = getDb();
  await db.ready();
  const threads = (await db.listDmThreadsForUser(user.id)).filter((t) => t.teacherId === user.id);
  const rows: { thread: (typeof threads)[0]; otherName: string; courseTitle: string }[] = [];
  for (const th of threads) {
    const other = th.studentId;
    const u = await db.findUserById(other);
    const tr = getTrack(th.trackSlug);
    rows.push({
      thread: th,
      otherName: u?.name ?? "Student",
      courseTitle: tr?.title ?? th.trackSlug,
    });
  }
  rows.sort((a, b) => b.thread.lastMessageAt - a.thread.lastMessageAt);

  return (
    <div className="section-pad-x py-8 max-w-2xl mx-auto w-full">
      <h1
        className="font-[family-name:var(--role-font-display)] text-2xl font-extrabold mb-2"
        style={{ color: "var(--text-1)" }}
      >
        Inbox
      </h1>
      <p className="text-sm mb-6" style={{ color: "var(--text-2)" }}>
        One-on-one threads with students in your courses. Open a thread to reply.
      </p>
      {rows.length === 0 ? (
        <div className="card p-8 text-center text-sm" style={{ color: "var(--text-3)", border: "1px solid var(--border-1)" }}>
          No message threads yet. When a student messages you from a course, it will show up here.
        </div>
      ) : (
        <ul className="space-y-2">
          {rows.map(({ thread: th, otherName, courseTitle }) => (
            <li key={th.id}>
              <Link
                href={`/tracks/${encodeURIComponent(th.trackSlug)}/messages?thread=${encodeURIComponent(th.id)}`}
                className="card flex flex-col gap-1 p-4 transition-colors hover:brightness-110"
                style={{ border: "1px solid var(--border-1)" }}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold" style={{ color: "var(--text-1)" }}>
                    {otherName}
                  </span>
                  <span className="text-[12px] tabular-nums" style={{ color: "var(--text-3)" }}>
                    {fmtTime(th.lastMessageAt)}
                  </span>
                </div>
                <div className="text-[13px]" style={{ color: "var(--text-2)" }}>
                  {courseTitle}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
