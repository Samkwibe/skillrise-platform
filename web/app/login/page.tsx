import { Suspense } from "react";
import { getCurrentUser } from "@/lib/auth";
import { isEmailVerified } from "@/lib/auth";
import { redirect } from "next/navigation";
import { LoginPortalView } from "@/components/auth/login-portal-view";
import { AuthPageSkeleton } from "@/components/auth/auth-page-skeleton";

export const metadata = { title: "Sign in · SkillRise" };

export default async function LoginPage() {
  const u = await getCurrentUser();
  if (u) redirect(isEmailVerified(u) ? "/dashboard" : "/verify-email/required");

  return (
    <Suspense fallback={<AuthPageSkeleton />}>
      <LoginPortalView />
    </Suspense>
  );
}
