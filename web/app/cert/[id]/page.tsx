import Link from "next/link";
import { notFound } from "next/navigation";
import { store, getTrack, findUserById } from "@/lib/store";
import { Avatar } from "@/components/ui/avatar";

export const dynamic = "force-dynamic";

export default async function PublicCertificate({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cert = store.certificates.find((c) => c.id === id);
  if (!cert) return notFound();
  const owner = findUserById(cert.userId);
  const track = getTrack(cert.trackSlug);
  const teacher = track ? findUserById(track.teacherId) : null;

  return (
    <div className="min-h-screen bg-ink text-t1">
      <header className="h-[66px] border-b border-border1 flex items-center justify-between px-6 md:px-12">
        <Link href="/" className="font-display text-[20px] font-extrabold text-g">
          Skill<span className="text-t1">Rise</span>
        </Link>
        <Link href="/verify" className="btn btn-ghost btn-sm">Verify another credential</Link>
      </header>
      <main className="max-w-[840px] mx-auto px-6 md:px-12 py-14">
        <div className="card p-8 md:p-12 bg-gradient-to-br from-[#071a10] to-[#0d2a1c]">
          <div className="flex items-center justify-between mb-8">
            <div className="pill pill-g">🏅 Verified credential</div>
            <div className="font-mono text-[11px] text-t3">{cert.id}</div>
          </div>
          <div className="font-display text-[14px] uppercase tracking-[0.2em] text-t3 mb-3">Certificate of Completion</div>
          <h1 className="font-display text-[clamp(28px,4vw,48px)] font-extrabold leading-tight mb-4">
            {track?.title ?? cert.trackSlug}
          </h1>
          <p className="text-t2 text-[15px] mb-10">
            This is to verify that <span className="font-semibold text-t1">{owner?.name}</span> of{" "}
            <span className="font-semibold text-t1">{owner?.neighborhood}</span> has demonstrated competence in{" "}
            <span className="font-semibold text-t1">{track?.title}</span> on SkillRise.
          </p>
          <div className="grid sm:grid-cols-3 gap-4 mb-8">
            <Field label="Score" value={`${cert.score} / 100`} />
            <Field label="Issued" value={new Date(cert.issuedAt).toLocaleDateString()} />
            <Field label="Modules" value={String(track?.modules.length ?? "—")} />
          </div>
          {teacher && (
            <div className="flex items-center gap-3 border-t border-border1 pt-6">
              <Avatar spec={teacher.avatar} size={48} />
              <div>
                <div className="text-[12px] text-t3">Taught & attested by</div>
                <div className="font-semibold">{teacher.name}</div>
                <div className="text-[12px] text-t3">{teacher.credentials}</div>
              </div>
            </div>
          )}
          <div className="border-t border-border1 mt-8 pt-6 text-[12px] text-t3 flex flex-wrap gap-6 justify-between">
            <div>Issuer: SkillRise · skillrise.app</div>
            <div>Open Badges 3.0 / W3C Verifiable Credential</div>
          </div>
        </div>
        <div className="text-center mt-6 text-[12px] text-t3">
          Anyone can re-verify this credential at any time at{" "}
          <Link href="/verify" className="underline">skillrise.app/verify</Link>
        </div>
      </main>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wider text-t3">{label}</div>
      <div className="font-semibold text-[16px]">{value}</div>
    </div>
  );
}
