import Link from "next/link";
import type { User } from "@/lib/store";
import { Avatar } from "@/components/ui/avatar";
import { LogoutButton } from "@/components/logout-button";
import { AccountVerificationPanel } from "@/components/auth/account-verification-panel";

/**
 * Minimal chrome when the user is signed in but has not verified email yet.
 * No main app nav — only verify + sign out.
 */
export function UnverifiedShell({ user, children }: { user: User; children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-ink text-t1">
      <header className="shrink-0 border-b border-border1 px-6 py-4 flex items-center justify-between gap-4">
        <Link href="/" className="font-display text-[20px] font-extrabold text-g">
          Skill<span className="text-t1">Rise</span>
        </Link>
        <div className="flex items-center gap-3 min-w-0">
          <Avatar spec={user.avatar} photoUrl={user.avatarUrl} name={user.name} size={36} />
          <span className="text-[13px] font-medium truncate max-w-[140px] sm:max-w-[200px]">{user.name}</span>
          <LogoutButton />
        </div>
      </header>
      <main className="flex-1 section-pad-x py-10 max-w-[640px] mx-auto w-full">
        <AccountVerificationPanel />
        {children}
      </main>
    </div>
  );
}
