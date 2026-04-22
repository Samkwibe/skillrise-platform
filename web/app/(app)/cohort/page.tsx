import Link from "next/link";
import { requireVerifiedUser } from "@/lib/auth";
import { store, getTrack, findUserById } from "@/lib/store";
import { PageHeader } from "@/components/page-header";
import { Avatar } from "@/components/ui/avatar";
import { CohortChat } from "@/components/cohort-chat";

export const dynamic = "force-dynamic";

export default async function CohortPage() {
  const user = await requireVerifiedUser();
  const myCohorts = user.role === "teacher"
    ? store.cohorts.filter((c) => store.tracks.find((t) => t.slug === c.trackSlug)?.teacherId === user.id)
    : store.cohorts.filter((c) => c.members.includes(user.id));

  if (myCohorts.length === 0) {
    return (
      <div className="section-pad-x py-10">
        <PageHeader eyebrow="Cohort" title="No active cohort yet." subtitle="Enroll in a track to be matched with a neighborhood cohort." />
        <Link href="/tracks" className="btn btn-primary">Browse tracks</Link>
      </div>
    );
  }

  const cohort = myCohorts[0];
  const track = getTrack(cohort.trackSlug);
  const messages = store.cohortMessages.filter((m) => m.cohortId === cohort.id).sort((a, b) => a.at - b.at);

  return (
    <div className="section-pad-x py-10">
      <PageHeader
        eyebrow="My cohort"
        title={`${track?.title} · ${cohort.neighborhood}`}
        subtitle={`Started ${new Date(cohort.startDate).toLocaleDateString()} · ${cohort.members.length} member${cohort.members.length === 1 ? "" : "s"}`}
      />
      <div className="grid lg:grid-cols-[1fr_280px] gap-6">
        <CohortChat
          cohortId={cohort.id}
          initial={messages.map((m) => ({
            id: m.id,
            userId: m.userId,
            text: m.text,
            at: m.at,
            author: findUserById(m.userId),
          }))}
          currentUserId={user.id}
        />
        <aside>
          <div className="card p-4">
            <div className="text-[12px] uppercase tracking-wider text-t3 mb-2">Members</div>
            <div className="flex flex-col gap-2">
              {cohort.members.map((mid) => {
                const m = findUserById(mid);
                if (!m) return null;
                return (
                  <div key={mid} className="flex items-center gap-2">
                    <Avatar spec={m.avatar} size={32} />
                    <div>
                      <div className="text-[13px] font-semibold">{m.name}</div>
                      <div className="text-[11px] text-t3 capitalize">{m.role}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
