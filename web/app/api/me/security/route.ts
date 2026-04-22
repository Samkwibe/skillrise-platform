import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { getVerifiedUserForApi } from "@/lib/auth";
import { markSecurityNotificationsRead } from "@/lib/security/security-notifications";
import { formatZodError } from "@/lib/validators";

export const dynamic = "force-dynamic";

const patchBodySchema = z.object({
  readIds: z.array(z.string().min(1)).optional(),
  markAllRead: z.boolean().optional(),
});

export async function GET() {
  const sessionUser = await getVerifiedUserForApi();
  if (sessionUser instanceof NextResponse) return sessionUser;
  const db = getDb();
  const user = await db.findUserById(sessionUser.id);
  if (!user) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }
  return NextResponse.json({
    notifications: user.securityNotifications ?? [],
  });
}

export async function PATCH(req: Request) {
  const sessionUser = await getVerifiedUserForApi();
  if (sessionUser instanceof NextResponse) return sessionUser;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = patchBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: formatZodError(parsed.error) },
      { status: 400 },
    );
  }
  const db = getDb();
  const user = await db.findUserById(sessionUser.id);
  if (!user) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }
  const { markAllRead, readIds } = parsed.data;
  if (markAllRead === true) {
    await markSecurityNotificationsRead(user, "all");
  } else if (readIds && readIds.length > 0) {
    await markSecurityNotificationsRead(user, readIds);
  } else {
    return NextResponse.json(
      { error: "Send markAllRead: true or a non-empty readIds array." },
      { status: 400 },
    );
  }
  const next = await db.findUserById(user.id);
  return NextResponse.json({
    notifications: next?.securityNotifications ?? [],
  });
}
