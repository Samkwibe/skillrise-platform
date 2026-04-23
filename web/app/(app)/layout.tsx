import { RoleShell } from "@/components/shells";
import { ensureTracksFromDatabase } from "@/lib/course/ensure-tracks";

export default async function AuthedLayout({ children }: { children: React.ReactNode }) {
  await ensureTracksFromDatabase();
  return <RoleShell>{children}</RoleShell>;
}
