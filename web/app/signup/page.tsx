import { Suspense } from "react";
import { SignupPortalView } from "@/components/auth/signup-portal-view";
import { AuthPageSkeleton } from "@/components/auth/auth-page-skeleton";
import { getCurrentUser } from "@/lib/auth";
import { isGoogleOAuthConfigured } from "@/lib/auth/google-oauth";
import { redirect } from "next/navigation";

export const metadata = { title: "Create account · SkillRise" };

export default async function SignupPage() {
  const u = await getCurrentUser();
  if (u) redirect(u.emailVerifiedAt ? "/dashboard" : "/verify-email/required");
  return (
    <Suspense fallback={<AuthPageSkeleton />}>
      <SignupPortalView showGoogle={isGoogleOAuthConfigured()} />
    </Suspense>
  );
}
