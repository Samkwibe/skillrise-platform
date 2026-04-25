import { RoleShell } from "@/components/shells";
import { ensureTracksFromDatabase } from "@/lib/course/ensure-tracks";
import { ensureFeedFromDatabase } from "@/lib/feed/ensure-feed";

export default async function AuthedLayout({ children }: { children: React.ReactNode }) {
  await ensureTracksFromDatabase();
  await ensureFeedFromDatabase();
  return <RoleShell>{children}</RoleShell>;
}
