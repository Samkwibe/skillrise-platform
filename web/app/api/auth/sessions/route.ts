import { NextResponse } from "next/server";
import { z } from "zod";
import { cookies } from "next/headers";
import { getVerifiedUserForApi, SESSION_COOKIE } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { formatZodError } from "@/lib/validators";
import { appendSecurityNotification } from "@/lib/security/security-notifications";
import { rateLimit, clientKey, rateLimitHeaders } from "@/lib/security/rate-limit";

export const dynamic = "force-dynamic";

const deleteBodySchema = z.object({
  token: z.string().min(8).max(200).optional(),
  /** If true, delete every session including the current one (then sign out everywhere). */
  all: z.boolean().optional(),
});

export async function GET() {
  const user = await getVerifiedUserForApi();
  if (user instanceof NextResponse) return user;
  const db = getDb();
  const jar = await cookies();
  const current = jar.get(SESSION_COOKIE)?.value;
  const raw = await db.listSessionsByUserId(user.id);
  const sessions = raw.map((s) => ({
    token: s.token,
    current: s.token === current,
    createdAt: s.createdAt,
    lastUsedAt: s.lastUsedAt ?? s.createdAt,
    userAgent: s.userAgent,
    ip: s.ip,
  }));
  return NextResponse.json({ sessions });
}

export async function DELETE(req: Request) {
  const user = await getVerifiedUserForApi();
  if (user instanceof NextResponse) return user;
  const limit = rateLimit(clientKey(req, "sessions-revoke"), 30, 15 * 60 * 1000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many requests. Try again shortly." },
      { status: 429, headers: rateLimitHeaders(limit) },
    );
  }

  let body: unknown = {};
  try {
    if (req.headers.get("content-type")?.includes("application/json")) {
      body = await req.json();
    }
  } catch {
    body = {};
  }
  const parsed = deleteBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: formatZodError(parsed.error) },
      { status: 400, headers: rateLimitHeaders(limit) },
    );
  }
  const { token: targetToken, all } = parsed.data;
  const db = getDb();
  const jar = await cookies();
  const current = jar.get(SESSION_COOKIE)?.value;

  if (all) {
    await appendSecurityNotification(user.id, {
      kind: "sessions_signed_out_everywhere",
      title: "Signed out everywhere",
      detail: "All devices were signed out, including this browser.",
    });
    await db.deleteSessionsForUser(user.id);
    jar.delete(SESSION_COOKIE);
    return NextResponse.json({ ok: true, signedOut: true }, { headers: rateLimitHeaders(limit) });
  }

  if (targetToken) {
    if (targetToken === current) {
      return NextResponse.json(
        { error: "Use the logout action to end this session." },
        { status: 400, headers: rateLimitHeaders(limit) },
      );
    }
    const s = await db.getSession(targetToken);
    if (!s || s.userId !== user.id) {
      return NextResponse.json({ error: "Session not found." }, { status: 404, headers: rateLimitHeaders(limit) });
    }
    await db.deleteSession(targetToken);
    await appendSecurityNotification(user.id, {
      kind: "sessions_revoked",
      title: "Session removed",
      detail: "A signed-in device was removed from your account.",
    });
    return NextResponse.json({ ok: true }, { headers: rateLimitHeaders(limit) });
  }

  await db.deleteSessionsForUser(user.id, current);
  await appendSecurityNotification(user.id, {
    kind: "sessions_revoked",
    title: "Signed out of other devices",
    detail: "Other browsers and devices were signed out; this session stayed active.",
  });
  return NextResponse.json(
    { ok: true, message: "Signed out of other devices." },
    { headers: rateLimitHeaders(limit) },
  );
}
