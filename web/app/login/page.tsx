import { Suspense } from "react";
import { getCurrentUser } from "@/lib/auth";
import { isGoogleOAuthConfigured } from "@/lib/auth/google-oauth";
import { redirect } from "next/navigation";
import { LoginPortalView } from "@/components/auth/login-portal-view";
import { AuthPageSkeleton } from "@/components/auth/auth-page-skeleton";

export const metadata = { title: "Sign in · SkillRise" };

export default async function LoginPage() {
  const u = await getCurrentUser();
  if (u) redirect(u.emailVerifiedAt ? "/dashboard" : "/verify-email/required");

  return (
    <Suspense fallback={<AuthPageSkeleton />}>
      <LoginPortalView showGoogle={isGoogleOAuthConfigured()} />
    </Suspense>
  );
}
