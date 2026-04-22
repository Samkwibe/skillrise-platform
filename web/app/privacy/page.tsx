import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";

export const metadata = {
  title: "Privacy — SkillRise",
  description: "How SkillRise handles your data.",
};

export default function PrivacyPage() {
  return (
    <>
      <Nav />
      <main className="section-pad">
        <div className="mx-wrap" style={{ maxWidth: 760 }}>
          <div className="stag">Legal</div>
          <h1 className="sh">Privacy Policy</h1>
          <p className="ss mb-6">
            SkillRise is a free platform funded by employers, not ads. We collect the
            minimum data needed to help you learn, get certified, and get hired.
          </p>

          <h3 className="font-display font-bold text-[18px] mt-6 mb-2">What we collect</h3>
          <p className="text-t2 text-[14px] leading-[1.7] mb-4">
            Account info (email, phone, name), learning progress, and — if you sign a
            certificate — identity verification data (deleted immediately after issuance).
          </p>

          <h3 className="font-display font-bold text-[18px] mt-6 mb-2">What we never do</h3>
          <p className="text-t2 text-[14px] leading-[1.7] mb-4">
            Sell your data. Run third-party ads. Share identity data with employers.
            DM minors from adult strangers. Use dark patterns to keep you scrolling.
          </p>

          <h3 className="font-display font-bold text-[18px] mt-6 mb-2">Your rights</h3>
          <p className="text-t2 text-[14px] leading-[1.7] mb-4">
            Export, correct, or delete your data at any time. Deletions purge PII within
            30 days. Certificates stay verifiable at your discretion.
          </p>

          <p className="text-t3 text-[12px] mt-10">
            This page is a placeholder. Legal review pending.
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
