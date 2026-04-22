import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireVerifiedUser } from "@/lib/auth";
import {
  getCommunityRoom,
  listCommunityMessages,
  findUserById,
  LIFE_CATEGORIES,
} from "@/lib/store";
import { CommunityChat } from "@/components/community/community-chat";

export const dynamic = "force-dynamic";

type RouteCtx = { params: Promise<{ roomId: string }> };

export async function generateMetadata({ params }: RouteCtx) {
  const { roomId } = await params;
  const r = getCommunityRoom(roomId);
  return { title: r ? `${r.name} · Community · SkillRise` : "Community · SkillRise" };
}

export default async function RoomPage({ params }: RouteCtx) {
  const { roomId } = await params;
  const user = await requireVerifiedUser();
  if (user.role === "employer" || user.role === "school") redirect("/dashboard");

  const room = getCommunityRoom(roomId);
  if (!room) notFound();
  if (user.role === "teen" && !room.teenSafe) redirect("/community");

  const initialMessages = listCommunityMessages(room.id, 150).map((m) => {
    const author = findUserById(m.userId);
    return {
      ...m,
      author: author
        ? { id: author.id, name: author.name, role: author.role, avatar: author.avatar }
        : null,
    };
  });

  const cat = room.category ? LIFE_CATEGORIES.find((c) => c.id === room.category) : null;
  const host = room.hostUserId ? findUserById(room.hostUserId) : null;

  return (
    <div className="py-4 md:py-6">
      <div className="mb-4 flex items-center gap-2 text-[12px]" style={{ color: "var(--text-3)" }}>
        <Link href="/community" className="hover:underline">← Community</Link>
        <span>·</span>
        <span>{cat ? `${cat.emoji} ${cat.label}` : "General"}</span>
      </div>
      <header className="cover-card p-5 mb-4">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="min-w-0">
            <h1
              className="font-extrabold text-[22px] md:text-[26px]"
              style={{ fontFamily: "var(--role-font-display)" }}
            >
              {room.name}
            </h1>
            <p className="text-[13.5px] mt-1" style={{ color: "var(--text-2)" }}>
              {room.description}
            </p>
          </div>
          <div className="flex flex-col items-end text-right text-[11.5px]" style={{ color: "var(--text-3)" }}>
            <div>{room.memberCount.toLocaleString()} members</div>
            {host && (
              <div className="mt-0.5">
                Hosted by <span className="font-semibold" style={{ color: "var(--text-1)" }}>{host.name}</span>
              </div>
            )}
            {room.kind === "teen-safe" && (
              <span className="mt-2 px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: "var(--surface-2)", color: "var(--text-2)" }}>
                ★ Moderated teen room
              </span>
            )}
          </div>
        </div>
      </header>
      <CommunityChat
        roomId={room.id}
        currentUser={{ id: user.id, name: user.name, avatar: user.avatar, role: user.role }}
        initialMessages={initialMessages}
      />
      <p className="mt-6 text-[11.5px] max-w-[640px]" style={{ color: "var(--text-3)" }}>
        This room is public within SkillRise. Be kind. Slurs, threats, and solicitation are auto-flagged
        for moderator review. Use "Report" on any message that crosses a line.
      </p>
    </div>
  );
}
