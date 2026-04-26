import Link from "next/link";
import { requireVerifiedUser } from "@/lib/auth";
import { PageHeader } from "@/components/page-header";
import { Avatar } from "@/components/ui/avatar";
import { ProfileForm } from "@/components/profile-form";
import { ProfileTabs, buildProfileNavTabs, type ProfileNavTab } from "@/components/profile/profile-tabs";
import { SavedLessons } from "@/components/profile/saved-lessons";
import { userSavedFeed, findUserById, LIFE_CATEGORIES, publicUser } from "@/lib/store";
import { PhoneVerificationCard } from "@/components/profile/phone-verification-card";
import { isSmsSendConfigured, willSmsActuallySend } from "@/lib/sms/transactional";

export const dynamic = "force-dynamic";

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const user = await requireVerifiedUser();
  const sp = await searchParams;
  const canSave = user.role === "learner" || user.role === "teen";
  const tab: ProfileNavTab = canSave && sp.tab === "saved" ? "saved" : "account";

  // Server-side hydrated list so the saved tab pops up instantly.
  const saved = canSave
    ? userSavedFeed(user).map((p) => {
        const author = findUserById(p.authorId);
        const category = LIFE_CATEGORIES.find((c) => c.id === p.category) ?? null;
        return {
          post: p,
          author: author
            ? { id: author.id, name: author.name, role: author.role, avatar: author.avatar, credentials: author.credentials }
            : null,
          category,
        };
      })
    : [];
  const savedCount = saved.length;
  const profileSafe = publicUser(user);

  return (
    <div className="section-pad-x py-10">
      <PageHeader
        eyebrow="Profile"
        title="Your account."
        subtitle="Update your info, review what you saved, or download your data at any time."
      />

      <ProfileTabs
        active={tab}
        tabs={buildProfileNavTabs({ canSave, savedCount })}
      />

      {tab === "saved" ? (
        <SavedLessons
          items={saved.map((s) => ({
            post: {
              id: s.post.id,
              title: s.post.title,
              description: s.post.description,
              emoji: s.post.emoji,
              duration: s.post.duration,
              likes: s.post.likes,
              comments: s.post.comments.map((c) => ({ id: c.id, userId: c.userId, text: c.text, at: c.at })),
              youth: s.post.youth,
              trackSlug: s.post.trackSlug,
              category: s.post.category,
              takeaway: s.post.takeaway,
              createdAt: s.post.createdAt,
            },
            author: s.author,
            category: s.category,
          }))}
        />
      ) : (
        <div className="grid lg:grid-cols-[320px_1fr] gap-6">
          <div className="card p-5">
            <div className="flex items-center gap-3 mb-4">
              <Avatar spec={user.avatar} photoUrl={user.avatarUrl} name={user.name} size={56} />
              <div>
                <div className="font-semibold">{user.name}</div>
                <div className="text-[12px] text-t3 capitalize">{user.role}</div>
              </div>
            </div>
            <div className="text-[13px] text-t2 space-y-1">
              <div>📍 {user.neighborhood}</div>
              <div>✉️ {user.email}</div>
              {user.company && <div>🏢 {user.company}</div>}
              {user.age && <div>🎂 Age {user.age}</div>}
            </div>
            <div className="border-t border-border1 mt-4 pt-4 space-y-3">
              <div>
                <div className="text-[11px] uppercase tracking-wide text-t3 mb-1">Security</div>
                <p className="text-[13px] text-t2 mb-2">Sessions, password, and recent account activity live on a dedicated page.</p>
                <Link href="/profile/security" className="btn btn-ghost btn-sm w-fit">
                  Open security settings
                </Link>
              </div>
              <a href="/api/me/export" className="btn btn-ghost btn-sm">Download my data (JSON)</a>
            </div>
            <div className="pt-2">
              <PhoneVerificationCard
                smsEnabled={isSmsSendConfigured()}
                phoneVerified={profileSafe.phoneVerified}
                phoneMasked={profileSafe.phoneMasked}
                phonePendingMasked={profileSafe.phonePendingMasked}
                devHint={isSmsSendConfigured() && !willSmsActuallySend()}
              />
            </div>
          </div>
          <ProfileForm
            initial={{
              name: user.name,
              neighborhood: user.neighborhood,
              bio: user.bio || "",
              credentials: user.credentials || "",
            }}
          />
        </div>
      )}
    </div>
  );
}
