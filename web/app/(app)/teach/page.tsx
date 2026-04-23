import Link from "next/link";
import { requireVerifiedUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { store } from "@/lib/store";
import { PageHeader } from "@/components/page-header";

export const dynamic = "force-dynamic";

export default async function TeachStudio() {
  const user = await requireVerifiedUser();
  if (user.role !== "teacher" && user.role !== "admin") redirect("/dashboard");

  const myTracks = store.tracks.filter((t) => t.teacherId === user.id);
  const myPosts = store.feed.filter((f) => f.authorId === user.id);
  const myLive = store.liveSessions.filter((l) => l.teacherId === user.id);
  const studentsReached = new Set<string>();
  for (const t of myTracks) {
    store.enrollments.filter((e) => e.trackSlug === t.slug).forEach((e) => studentsReached.add(e.userId));
  }
  for (const l of myLive) l.attendees.forEach((a) => studentsReached.add(a));
  const hires = store.applications.filter((a) => a.status === "hired" && myTracks.some((t) => store.jobs.find((j) => j.id === a.jobId)?.requiredTrackSlug === t.slug)).length;

  return (
    <div className="section-pad-x py-10">
      <PageHeader
        eyebrow="Teach Studio"
        title="Your impact, in one place."
        subtitle="Record lessons, host live sessions, build full tracks — and see exactly how many lives you changed."
        right={
          <>
            <Link href="/teach/courses" className="btn btn-primary btn-sm">Course builder</Link>
            <Link href="/teach/record" className="btn btn-ghost btn-sm">+ Record a lesson</Link>
            <Link href="/teach/live" className="btn btn-ghost btn-sm">+ Schedule live</Link>
            <Link href="/teach/quizzes" className="btn btn-ghost btn-sm">Video quizzes</Link>
            <Link href="/teach/ai" className="btn btn-ghost btn-sm">AI assistant</Link>
            <Link href="/teach/students" className="btn btn-ghost btn-sm">Student success</Link>
            <Link href="/teach/impact" className="btn btn-ghost btn-sm">Community impact</Link>
          </>
        }
      />

      <div className="grid md:grid-cols-4 gap-4 mb-10">
        <Stat label="Students reached" value={studentsReached.size} />
        <Stat label="Lessons on SkillFeed" value={myPosts.length} />
        <Stat label="Live sessions" value={myLive.length} />
        <Stat label="Hires from your tracks" value={hires} color="g" />
      </div>

      <h2 className="font-display text-[20px] font-bold mb-3">Your tracks</h2>
      <div className="grid md:grid-cols-2 gap-4 mb-10">
        {myTracks.length === 0 && <div className="text-t3 text-[13px]">No tracks yet. Ping the editorial team to co-build one.</div>}
        {myTracks.map((t) => {
          const enr = store.enrollments.filter((e) => e.trackSlug === t.slug);
          return (
            <Link key={t.slug} href={`/tracks/${t.slug}`} className="card card-hover p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-[10px] flex items-center justify-center text-[20px]" style={{ background: `rgba(${t.color},0.14)` }}>{t.heroEmoji}</div>
                <div className="font-semibold">{t.title}</div>
              </div>
              <div className="text-[12px] text-t3">
                {enr.length} enrolled · {enr.filter((e) => e.completedAt).length} graduated
              </div>
            </Link>
          );
        })}
      </div>

      <h2 className="font-display text-[20px] font-bold mb-3">Your SkillFeed</h2>
      <div className="grid md:grid-cols-3 gap-4">
        {myPosts.length === 0 && <div className="text-t3 text-[13px]">No lessons posted yet. <Link href="/teach/record" className="underline text-t2">Record your first →</Link></div>}
        {myPosts.map((p) => (
          <div key={p.id} className="card p-4">
            <div className="aspect-video bg-gradient-to-br from-[#0d2a1c] to-[#071a10] rounded-[10px] flex items-center justify-center text-[40px] mb-3">{p.emoji}</div>
            <div className="font-semibold text-[14px] mb-1">{p.title}</div>
            <div className="text-[12px] text-t3">♥ {p.likes.toLocaleString()} · 💬 {p.comments.length} · {p.duration}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string | number; color?: "g" }) {
  return (
    <div className="card p-5">
      <div className="text-[12px] uppercase tracking-wider text-t3">{label}</div>
      <div className={`font-display text-[28px] font-extrabold mt-1 ${color === "g" ? "text-g" : ""}`}>{value}</div>
    </div>
  );
}
