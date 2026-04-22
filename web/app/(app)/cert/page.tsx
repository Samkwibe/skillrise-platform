import Link from "next/link";
import { requireVerifiedUser } from "@/lib/auth";
import { userCertificates, getTrack } from "@/lib/store";
import { PageHeader } from "@/components/page-header";

export const dynamic = "force-dynamic";

export default async function MyCerts() {
  const user = await requireVerifiedUser();
  const certs = userCertificates(user.id);
  return (
    <div className="section-pad-x py-10">
      <PageHeader
        eyebrow="Certificates"
        title="Verifiable proof of what you can do."
        subtitle="Open Badges 3.0 / W3C Verifiable Credentials. Share a link or QR — employers confirm in seconds."
      />
      {certs.length === 0 ? (
        <div className="card p-6 text-center">
          <p className="text-t2 mb-4">No certificates yet. Finish a track to earn one.</p>
          <Link href="/tracks" className="btn btn-primary">Browse tracks</Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {certs.map((c) => {
            const t = getTrack(c.trackSlug);
            return (
              <Link key={c.id} href={`/cert/${c.id}`} className="card card-hover p-6">
                <span className="pill pill-g mb-3">🏅 Verifiable credential</span>
                <div className="font-display text-[20px] font-bold">{t?.title ?? c.trackSlug}</div>
                <div className="text-[13px] text-t3 mt-1">Score {c.score} · Issued {new Date(c.issuedAt).toLocaleDateString()}</div>
                <div className="text-[12px] text-t2 mt-3 break-all">ID: {c.id}</div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
