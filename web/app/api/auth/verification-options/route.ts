import { NextResponse } from "next/server";
import { getCurrentUser, isEmailVerified } from "@/lib/auth";
import { isSmsSendConfigured, getDevTemporarySmsInboxUrl } from "@/lib/sms/transactional";

export const dynamic = "force-dynamic";

/**
 * Unverified: which verification channels the server offers + saved preference.
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }
  if (isEmailVerified(user)) {
    return NextResponse.json({ error: "Already verified." }, { status: 400 });
  }
  const sms = isSmsSendConfigured();
  return NextResponse.json({
    emailAvailable: true,
    smsAvailable: sms,
    preferred: user.preferredVerificationChannel === "sms" && sms ? "sms" : "email",
    tempSmsInboxUrl: getDevTemporarySmsInboxUrl(),
  });
}
