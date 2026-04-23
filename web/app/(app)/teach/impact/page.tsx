import Link from "next/link";
import { requireVerifiedUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { getCommunityImpactForTeacher } from "@/lib/services/teacher-impact";

export const dynamic = "force-dynamic";

function fmt(d: number) {
  return new Date(d).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export default async function TeacherImpactPage() {
  const user = await requireVerifiedUser();
  if (user.role !== "teacher" && user.role !== "admin") redirect("/dashboard");

  const impact = await getCommunityImpactForTeacher(user.id);

  return (
    <div className="section-pad-x py-8 max-w-[900px] mx-auto">
      <div className="mb-4">
        <Link href="/teach" className="text-sm text-t2 underline">
          ← Teach Studio
        </Link>
      </div>
      <PageHeader
        eyebrow="Teach · Impact"
        title="Community impact"
        subtitle="A snapshot of learners you have reached, credentials earned in your tracks, and hires tied to the skills you teach. Thank-you messages are added over time as learners share feedback."
      />

      {impact.trackSlugs.length === 0 && (
        <p className="text-sm text-t2 mb-6">You do not have published tracks yet. When you do, this dashboard will fill in automatically.</p>
      )}

      <div className="grid sm:grid-cols-2 gap-4 mb-10">
        <Stat label="Learners helped (enrolled in your tracks)" value={impact.studentsHelped} />
        <Stat label="Certificates earned (your tracks)" value={impact.certificatesEarned} />
        <Stat label="Job placements (hired · required your track)" value={impact.jobPlacements} highlight />
        <Stat label="Live session learners (your hosted sessions)" value={impact.liveLearnersTouched} />
      </div>

      <section className="card p-5">
        <h2 className="font-display text-lg font-bold mb-1">Thank-you messages</h2>
        <p className="text-sm text-t2 mb-4">
          Short notes from learners (demo data today; in production this can be collected after course completion or
          from an optional “thank your instructor” prompt).
        </p>
        {impact.thankYous.length === 0 ? (
          <p className="text-sm text-t3">No messages yet — keep teaching, they often show up when learners land wins.</p>
        ) : (
          <ul className="space-y-4">
            {impact.thankYous.map((m) => (
              <li key={m.id} className="border-b border-border1 pb-4 last:border-0">
                <p className="text-sm text-t1 whitespace-pre-wrap leading-relaxed">{m.message}</p>
                <div className="text-xs text-t3 mt-2">
                  {m.fromName}
                  {m.trackTitle ? ` · ${m.trackTitle}` : ""} · {fmt(m.at)}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className="card p-5">
      <div className="text-[12px] uppercase tracking-wider text-t3">{label}</div>
      <div className={`font-display text-[28px] font-extrabold mt-1 ${highlight ? "text-g" : ""}`}>{value}</div>
    </div>
  );
}
