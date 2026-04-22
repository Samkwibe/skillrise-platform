import { NextResponse } from "next/server";
import { getCurrentUser, isEmailVerified } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { publicUser } from "@/lib/store";
import { verificationChannelSchema, formatZodError } from "@/lib/validators";
import { isSmsSendConfigured } from "@/lib/sms/transactional";
import { z } from "zod";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  channel: verificationChannelSchema,
});

/** Set preferred first-time verification channel (email vs SMS) before the account is verified. */
export async function PATCH(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }
  if (isEmailVerified(user)) {
    return NextResponse.json({ error: "Already verified." }, { status: 400 });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: formatZodError(parsed.error) },
      { status: 400 },
    );
  }
  if (parsed.data.channel === "sms" && !isSmsSendConfigured()) {
    return NextResponse.json(
      { error: "SMS verification is not enabled on this server." },
      { status: 400 },
    );
  }
  const db = getDb();
  const updated = await db.updateUser(user.id, {
    preferredVerificationChannel: parsed.data.channel,
  });
  if (!updated) {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
  return NextResponse.json({ ok: true, user: publicUser(updated), preferred: parsed.data.channel });
}
