import { requireVerifiedUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { store, pledgeCounters } from "@/lib/store";
import { PageHeader } from "@/components/page-header";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await requireVerifiedUser();
  if (user.role !== "admin") redirect("/dashboard");

  const { total: pledgeTotal } = pledgeCounters();
  const totalHires = store.applications.filter((a) => a.status === "hired").length;
  const byRole: Record<string, number> = {};
  for (const u of store.users) byRole[u.role] = (byRole[u.role] ?? 0) + 1;

  return (
    <div className="section-pad-x py-10">
      <PageHeader
        eyebrow="Admin"
        title="Platform health"
        subtitle="Growth, safety, and editorial queue. Moderation tools live here."
      />
      <div className="grid md:grid-cols-4 gap-4 mb-8">
        <Stat label="Users" value={store.users.length} />
        <Stat label="Tracks" value={store.tracks.length} />
        <Stat label="SkillFeed posts" value={store.feed.length} />
        <Stat label="Jobs posted" value={store.jobs.length} />
        <Stat label="Applications" value={store.applications.length} />
        <Stat label="Hires" value={totalHires} />
        <Stat label="Certificates issued" value={store.certificates.length} />
        <Stat label="Pledges signed" value={pledgeTotal} />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="card p-5">
          <h2 className="font-display text-[18px] font-bold mb-3">Users by role</h2>
          <div className="flex flex-col gap-2">
            {Object.entries(byRole).map(([r, n]) => (
              <div key={r} className="flex justify-between text-[13px]">
                <span className="capitalize text-t2">{r}</span>
                <span className="font-semibold">{n}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <h2 className="font-display text-[18px] font-bold mb-3">Moderation queue</h2>
          {store.reports.length === 0 ? (
            <div className="text-t3 text-[13px]">No open reports. 🎉</div>
          ) : (
            <div className="flex flex-col gap-2">
              {store.reports.map((r) => (
                <div key={r.id} className="flex items-center justify-between text-[13px] border-b border-border1 pb-2">
                  <div>
                    <span className="pill pill-red">{r.targetType}</span>{" "}
                    <span className="text-t2">{r.reason}</span>
                  </div>
                  <span className="text-t3 text-[11px]">{new Date(r.at).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card p-5">
          <h2 className="font-display text-[18px] font-bold mb-3">Recent enrollments</h2>
          <div className="flex flex-col gap-2">
            {[...store.enrollments].sort((a, b) => b.startedAt - a.startedAt).slice(0, 8).map((e) => (
              <div key={e.id} className="flex justify-between text-[13px]">
                <span className="text-t2">{store.users.find((u) => u.id === e.userId)?.name ?? "—"}</span>
                <span className="text-t3">{e.trackSlug} · {new Date(e.startedAt).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <h2 className="font-display text-[18px] font-bold mb-3">Recent jobs</h2>
          <div className="flex flex-col gap-2">
            {[...store.jobs].sort((a, b) => b.postedAt - a.postedAt).slice(0, 8).map((j) => (
              <div key={j.id} className="flex justify-between text-[13px]">
                <span className="text-t2">{j.title} · {j.company}</span>
                <span className="text-t3">${j.wageFrom}–${j.wageTo}/{j.wageUnit}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="card p-5">
      <div className="text-[12px] uppercase tracking-wider text-t3">{label}</div>
      <div className="font-display text-[28px] font-extrabold mt-1">{value.toLocaleString()}</div>
    </div>
  );
}
