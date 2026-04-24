import Link from "next/link";
import { requireVerifiedUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { store } from "@/lib/store";
import { PageHeader } from "@/components/page-header";
import { ScheduleLiveForm } from "@/components/schedule-live-form";

export const dynamic = "force-dynamic";

export default async function ScheduleLivePage() {
  const user = await requireVerifiedUser();
  if (user.role !== "teacher" && user.role !== "admin") redirect("/dashboard");
  const myLive = store.liveSessions.filter((l) => l.teacherId === user.id).sort((a, b) => a.startsAt - b.startsAt);

  return (
    <div className="section-pad-x py-10">
      <PageHeader
        eyebrow="Teach · live"
        title="Schedule a live session."
        subtitle="We handle the tech (LiveKit under the hood). You just teach. Chat, hand-raise, and Q&A included."
        right={<Link href="/teach" className="btn btn-ghost btn-sm">← Dashboard</Link>}
      />
      <div className="grid lg:grid-cols-[1fr_360px] gap-8">
        <ScheduleLiveForm />
        <div>
          <h2 className="font-display text-[18px] font-bold mb-3">Your sessions</h2>
          <div className="flex flex-col gap-3">
            {myLive.length === 0 && <div className="card p-4 text-[13px] text-t3">No sessions scheduled yet.</div>}
            {myLive.map((l) => (
              <div key={l.id} className="card p-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`pill ${l.status === "ended" ? "" : "pill-red"}`}>● {l.status}</span>
                  {l.youth && <span className="pill pill-purple">★ Youth</span>}
                </div>
                <div className="font-semibold">{l.title}</div>
                <div className="text-[12px] text-t3">{new Date(l.startsAt).toLocaleString()} · {l.durationMin} min · {l.attendees.length} RSVP</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
