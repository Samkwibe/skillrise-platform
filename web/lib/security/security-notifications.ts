import { randomBytes } from "node:crypto";
import { getDb } from "@/lib/db";
import type { SecurityNotification, SecurityNotificationKind, User } from "@/lib/store";

const MAX = 50;

export async function appendSecurityNotification(
  userId: string,
  input: {
    kind: SecurityNotificationKind;
    title: string;
    detail?: string;
  },
): Promise<void> {
  const db = getDb();
  const u = await db.findUserById(userId);
  if (!u) return;
  const row: SecurityNotification = {
    id: `sn_${randomBytes(10).toString("hex")}`,
    kind: input.kind,
    title: input.title,
    detail: input.detail,
    at: Date.now(),
    read: false,
  };
  const list = [row, ...(u.securityNotifications ?? [])].slice(0, MAX);
  await db.updateUser(userId, { securityNotifications: list });
}

export async function markSecurityNotificationsRead(user: User, ids: string[] | "all"): Promise<void> {
  const list = user.securityNotifications ?? [];
  if (list.length === 0) return;
  const next =
    ids === "all"
      ? list.map((n) => ({ ...n, read: true }))
      : list.map((n) => (ids.includes(n.id) ? { ...n, read: true } : n));
  const db = getDb();
  await db.updateUser(user.id, { securityNotifications: next });
}
