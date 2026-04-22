import Link from "next/link";
import { Suspense } from "react";
import { SignupForm } from "@/components/auth/signup-form";
import { getCurrentUser } from "@/lib/auth";
import { isGoogleOAuthConfigured } from "@/lib/auth/google-oauth";
import { redirect } from "next/navigation";

export const metadata = { title: "Create account · SkillRise" };

export default async function SignupPage() {
  const u = await getCurrentUser();
  if (u) redirect(u.emailVerifiedAt ? "/dashboard" : "/verify-email/required");
  return (
    <div className="min-h-screen grid md:grid-cols-2 bg-ink text-t1">
      <div className="hidden md:flex flex-col justify-between p-12 bg-gradient-to-br from-[#170e00] to-[#2a1a00] border-r border-border1">
        <Link href="/" className="font-display text-[22px] font-extrabold text-g">
          Skill<span className="text-t1">Rise</span>
        </Link>
        <div>
          <h2 className="font-display text-[36px] font-extrabold leading-tight mb-3">
            Stop scrolling. Start rising.
          </h2>
          <ul className="text-t2 space-y-2 max-w-[440px]">
            <li>✓ Free, verified skill tracks — trade, tech, money, care</li>
            <li>✓ Local jobs with 90-day hire guarantees</li>
            <li>✓ Live sessions, cohorts, AI study assistant</li>
            <li>✓ Teach for free and see your real-world impact</li>
          </ul>
        </div>
        <div className="text-[12px] text-t3">No ads. No upsells. Learners never pay.</div>
      </div>
      <div className="p-6 md:p-12 flex items-center">
        <div className="w-full max-w-[520px] mx-auto">
          <Link href="/" className="md:hidden font-display text-[22px] font-extrabold text-g block mb-6">
            Skill<span className="text-t1">Rise</span>
          </Link>
          <h1 className="font-display text-[28px] font-extrabold mb-1">Create your free account.</h1>
          <p className="text-t2 text-[14px] mb-6">
            Already have one?{" "}
            <Link href="/login" className="text-g underline">Sign in</Link>
          </p>
          <Suspense fallback={null}>
            <SignupForm showGoogle={isGoogleOAuthConfigured()} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
