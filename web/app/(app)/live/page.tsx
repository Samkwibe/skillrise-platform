import Link from "next/link";
import { requireVerifiedUser } from "@/lib/auth";
import { store, findUserById } from "@/lib/store";
import { PageHeader } from "@/components/page-header";
import { Avatar } from "@/components/ui/avatar";
import { JoinLiveButton } from "@/components/join-live-button";

export const dynamic = "force-dynamic";

export default async function LivePage() {
  const user = await requireVerifiedUser();
  const filtered = store.liveSessions.filter((l) => (user.role === "teen" ? l.youth : true));
  const upcoming = filtered.filter((l) => l.status !== "ended").sort((a, b) => a.startsAt - b.startsAt);
  const past = filtered.filter((l) => l.status === "ended").sort((a, b) => b.startsAt - a.startsAt);

  return (
    <div className="section-pad-x py-10">
      <PageHeader
        eyebrow="Live"
        title="Learn live. Ask anything. Free."
        subtitle="Volunteer teachers host open sessions. Q&A chat, neighborhood cohort priority."
        right={user.role === "teacher" ? <Link href="/teach/live" className="btn btn-primary btn-sm">+ Schedule a live</Link> : undefined}
      />

      <h2 className="font-display text-[18px] font-bold mb-3">Upcoming & live now</h2>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {upcoming.length === 0 && <div className="text-t3 text-[13px]">Nothing scheduled yet.</div>}
        {upcoming.map((l) => {
          const teacher = findUserById(l.teacherId);
          const mins = Math.round((l.startsAt - Date.now()) / 60000);
          return (
            <div key={l.id} className="card p-5">
              <div className="flex items-center gap-2 mb-2">
                <span className={`pill ${l.status === "live" ? "pill-red" : ""}`}>● {l.status === "live" ? "Live now" : mins > 0 ? `In ${mins} min` : "Starting…"}</span>
                {l.youth && <span className="pill pill-purple">★ Youth</span>}
              </div>
              <div className="font-display text-[17px] font-bold mb-1">{l.title}</div>
              <div className="text-[12px] text-t3 mb-3">{l.topic} · {new Date(l.startsAt).toLocaleString()} · {l.durationMin} min</div>
              {teacher && (
                <div className="flex items-center gap-2 mb-4">
                  <Avatar spec={teacher.avatar} size={32} />
                  <div className="text-[12px] text-t2">{teacher.name}</div>
                </div>
              )}
              <JoinLiveButton id={l.id} joined={l.attendees.includes(user.id)} />
            </div>
          );
        })}
      </div>

      {past.length > 0 && (
        <>
          <h2 className="font-display text-[18px] font-bold mb-3">Recordings</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {past.map((l) => (
              <div key={l.id} className="card p-5 opacity-80">
                <span className="pill">Recording</span>
                <div className="font-semibold mt-2">{l.title}</div>
                <div className="text-[12px] text-t3">{new Date(l.startsAt).toLocaleDateString()} · {l.durationMin} min</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
