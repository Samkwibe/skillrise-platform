import { NextResponse } from "next/server";
import { getVerifiedUserForApi } from "@/lib/auth";
import { listCommunityRoomsFor, findUserById } from "@/lib/store";

export const dynamic = "force-dynamic";

/**
 * GET /api/community/rooms — returns rooms visible to the current user.
 * Teens never see non-teen-safe rooms. Employers/schools don't use this
 * feature but the API doesn't block them from browsing if they land here.
 */
export async function GET() {
  const user = await getVerifiedUserForApi();
  if (user instanceof NextResponse) return user;
  const rooms = listCommunityRoomsFor(user).map((r) => {
    const host = r.hostUserId ? findUserById(r.hostUserId) : null;
    return {
      ...r,
      host: host ? { id: host.id, name: host.name, avatar: host.avatar, credentials: host.credentials } : null,
    };
  });
  return NextResponse.json({ rooms });
}
