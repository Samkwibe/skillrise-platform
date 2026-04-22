import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * Shown to signed-in users who have not completed email verification.
 * Full app navigation is hidden until they verify (see `UnverifiedShell`).
 */
export default async function VerifyEmailRequiredPage() {
  await requireUser();
  return (
    <>
      <h1 className="font-display text-[clamp(24px,3vw,32px)] font-extrabold leading-tight mb-2">
        One more step
      </h1>
      <p className="text-t2 text-[15px] leading-relaxed max-w-prose">
        We sent a confirmation link to your email. Open it to unlock your dashboard, courses, and community
        features. You can resend the email if you don&apos;t see it within a few minutes.
      </p>
    </>
  );
}
