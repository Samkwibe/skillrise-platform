import { requireVerifiedUser } from "@/lib/auth";
import { store } from "@/lib/store";
import { PageHeader } from "@/components/page-header";
import { ChallengeTracker } from "@/components/challenge-tracker";

export const dynamic = "force-dynamic";

export default async function ChallengePage() {
  const user = await requireVerifiedUser();
  const progress = store.challengeProgress.find((p) => p.userId === user.id);
  const day = progress?.day ?? 0;
  return (
    <div className="section-pad-x py-10">
      <PageHeader
        eyebrow="30-Day Social Media Swap"
        title="Swap 30 minutes a day for a skill."
        subtitle="Every day you check in, we log it. Hit Day 30 and unlock a bonus certificate to share."
      />
      <ChallengeTracker day={day} />
    </div>
  );
}
