import Link from "next/link";
import { VerifyForm } from "@/components/verify-form";

export const metadata = { title: "Verify a credential · SkillRise" };

export default function VerifyPage() {
  return (
    <div className="min-h-screen bg-ink text-t1">
      <header className="h-[66px] border-b border-border1 flex items-center justify-between px-6 md:px-12">
        <Link href="/" className="font-display text-[20px] font-extrabold text-g">
          Skill<span className="text-t1">Rise</span>
        </Link>
      </header>
      <main className="max-w-[560px] mx-auto px-6 py-16">
        <div className="stag">Credential verification</div>
        <h1 className="font-display text-[clamp(26px,3vw,36px)] font-extrabold leading-tight mb-2">
          Check a SkillRise credential.
        </h1>
        <p className="text-t2 mb-8">Paste a certificate ID (e.g. <span className="font-mono">cert_tanya_elec</span>) or scan a QR code.</p>
        <VerifyForm />
      </main>
    </div>
  );
}
