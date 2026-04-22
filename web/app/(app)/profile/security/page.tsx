import Link from "next/link";
import { requireVerifiedUser } from "@/lib/auth";
import { PageHeader } from "@/components/page-header";
import { SessionSecurity } from "@/components/auth/session-security";
import { ProfileTabs, buildProfileNavTabs } from "@/components/profile/profile-tabs";
import { SecurityNotificationsPanel } from "@/components/profile/security-notifications-panel";
import { SecurityUpcomingPanel } from "@/components/profile/security-upcoming-panel";
import { userSavedFeed } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function ProfileSecurityPage() {
  const user = await requireVerifiedUser();
  const canSave = user.role === "learner" || user.role === "teen";
  const savedCount = canSave ? userSavedFeed(user).length : 0;
  const active = "security" as const;

  return (
    <div className="section-pad-x py-10">
      <PageHeader
        eyebrow="Profile"
        title="Security"
        subtitle="Email sign-in, password, sessions, and a running log of important account events."
      />

      <ProfileTabs
        active={active}
        tabs={buildProfileNavTabs({ canSave, savedCount })}
      />

      <div className="grid gap-6 max-w-[720px]">
        <section className="card p-5 space-y-3">
          <h2 className="text-[16px] font-bold text-t1">Email</h2>
          <p className="text-[13px] text-t2">
            Signed in as <span className="text-t1 font-medium">{user.email}</span>
            {user.emailVerifiedAt ? (
              <span className="ml-1 text-g font-medium">· Verified</span>
            ) : (
              <span className="ml-1 text-amber-400 font-medium">· Not verified</span>
            )}
          </p>
        </section>

        <section className="card p-5 space-y-2">
          <h2 className="text-[16px] font-bold text-t1">Phone</h2>
          <p className="text-[13px] text-t2">
            {user.phoneE164 && user.phoneVerifiedAt
              ? "You have a verified mobile number on file (shown masked in your profile) for trust and future optional SMS. Manage it on the profile page."
              : "Optional SMS verification is available on your profile — separate from how you sign in, useful for reminders and account trust later."}
          </p>
          <Link href="/profile" className="btn btn-ghost btn-sm w-fit">
            {user.phoneE164 && user.phoneVerifiedAt ? "Manage in profile" : "Add a number in profile"}
          </Link>
        </section>

        <section className="card p-5 space-y-3">
          <h2 className="text-[16px] font-bold text-t1">Password</h2>
          {!user.password ? (
            <p className="text-[13px] text-t2">
              This account has no password yet. Use “Send password reset email” to set one — the link lets you pick a
              password and keeps you signed in on the device you use to complete the reset. You can still use Google to
              sign in afterward.
            </p>
          ) : (
            <p className="text-[13px] text-t2">
              To change your password, request a link below and follow the email. After you set a new password, you’ll
              be signed in again on the device where you complete the reset.
            </p>
          )}
          <Link href="/forgot-password" className="btn btn-ghost btn-sm w-fit">
            Send password reset email
          </Link>
        </section>

        <section className="card p-5 space-y-3">
          <h2 className="text-[16px] font-bold text-t1">Active sessions</h2>
          <SessionSecurity />
        </section>

        <section className="card p-5 space-y-3">
          <h2 className="text-[16px] font-bold text-t1">Security activity</h2>
          <p className="text-[13px] text-t2">Recent events on your account (verification, password, sessions).</p>
          <SecurityNotificationsPanel />
        </section>

        <SecurityUpcomingPanel authGoogle={Boolean(user.googleSub)} />
      </div>
    </div>
  );
}
