import Link from "next/link";
import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";
import { getCurrentUser } from "@/lib/auth";
import { isGoogleOAuthConfigured } from "@/lib/auth/google-oauth";
import { redirect } from "next/navigation";

export const metadata = { title: "Sign in · SkillRise" };

export default async function LoginPage() {
  const u = await getCurrentUser();
  if (u) redirect(u.emailVerifiedAt ? "/dashboard" : "/verify-email/required");
  return (
    <div className="min-h-screen grid md:grid-cols-2 bg-ink text-t1">
      <div className="hidden md:flex flex-col justify-between p-12 bg-gradient-to-br from-[#071a10] to-[#0d2a1c] border-r border-border1">
        <Link href="/" className="font-display text-[22px] font-extrabold text-g">
          Skill<span className="text-t1">Rise</span>
        </Link>
        <div>
          <h2 className="font-display text-[36px] font-extrabold leading-tight mb-3">
            Sign in and get back to rising.
          </h2>
          <p className="text-t2 max-w-[440px]">
            Pick up where you left off — your modules, cohort, certificates, jobs, and study assistant are waiting.
          </p>
        </div>
        <div className="text-[12px] text-t3">100% free for learners. Always.</div>
      </div>
      <div className="p-6 md:p-12 flex items-center">
        <div className="w-full max-w-[420px] mx-auto">
          <Link href="/" className="md:hidden font-display text-[22px] font-extrabold text-g block mb-6">
            Skill<span className="text-t1">Rise</span>
          </Link>
          <h1 className="font-display text-[28px] font-extrabold mb-1">Welcome back.</h1>
          <p className="text-t2 text-[14px] mb-6">
            New here?{" "}
            <Link href="/signup" className="text-g underline">Create a free account</Link>
          </p>
          <Suspense fallback={null}>
            <LoginForm showGoogle={isGoogleOAuthConfigured()} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
