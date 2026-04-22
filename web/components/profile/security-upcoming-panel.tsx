import Link from "next/link";

type Props = {
  /** True when this account has used Google to sign in (or linked it). */
  authGoogle: boolean;
};

/**
 * 2FA and email alerts: roadmap. Google status reflects whether this account is linked.
 */
export function SecurityUpcomingPanel({ authGoogle }: Props) {
  return (
    <div className="card p-5 space-y-4">
      <div>
        <h2 className="text-[16px] font-bold text-t1">Sign-in & alerts</h2>
        <p className="text-[13px] text-t2 mt-1 max-w-[560px]">
          {authGoogle
            ? "This account is linked to Google. You can use “Continue with Google” on the sign-in page."
            : "You can use “Continue with Google” on the sign-in page if your team has enabled it — your account will be linked the first time you use the same email."}
        </p>
        {!authGoogle && (
          <p className="text-[13px] text-t2 mt-2">
            <Link href="/login" className="text-g font-semibold underline">
              Open sign in
            </Link>
          </p>
        )}
      </div>
      <ul className="text-[13px] text-t2 space-y-2 list-disc pl-5">
        <li>
          <span className="text-t1 font-medium">2FA (coming soon)</span> — an extra step at sign-in for
          high-assurance accounts. We’re designing phase 1 as optional email or SMS codes and phase 2 as an
          authenticator app (TOTP), building on the same security notifications you see today.
        </li>
        <li>
          <span className="text-t1 font-medium">Email alerts for security events (coming soon)</span> — get notified
          when your password is reset, devices sign out, or other important changes occur.
        </li>
      </ul>
    </div>
  );
}
