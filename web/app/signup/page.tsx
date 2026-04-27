import { Suspense } from "react";
import { SignupPortalView } from "@/components/auth/signup-portal-view";
import { AuthPageSkeleton } from "@/components/auth/auth-page-skeleton";
import { getCurrentUser } from "@/lib/auth";
import { isEmailVerified } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = { title: "Create account · SkillRise" };

export default async function SignupPage() {
  const u = await getCurrentUser();
  if (u) redirect(isEmailVerified(u) ? "/dashboard" : "/verify-email/required");
  return (
    <Suspense fallback={<AuthPageSkeleton />}>
      <SignupPortalView />
    </Suspense>
  );
}
