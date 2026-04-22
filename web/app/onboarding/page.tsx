import { redirect } from "next/navigation";
import { requireVerifiedUser } from "@/lib/auth";
import { OnboardingFlow } from "@/components/onboarding/onboarding-flow";

export const metadata = { title: "Welcome · SkillRise" };
export const dynamic = "force-dynamic";

/**
 * /onboarding — a welcoming 4-question check-in shown on a user's first
 * login. Accessible at any time (users can come back to retake it). The
 * page is intentionally outside the dashboard shell so it feels like
 * a gentle, human-scale conversation.
 */
export default async function OnboardingPage() {
  const user = await requireVerifiedUser();
  // Employers and schools don't take this — they have their own setup.
  if (user.role === "employer" || user.role === "school" || user.role === "admin") {
    redirect("/dashboard");
  }
  return <OnboardingFlow user={{ id: user.id, name: user.name, role: user.role }} existing={user.onboarding ?? null} />;
}
