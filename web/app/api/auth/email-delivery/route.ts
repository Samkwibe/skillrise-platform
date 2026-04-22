import { NextResponse } from "next/server";
import { getEmailClientHint } from "@/lib/email/config";

export const dynamic = "force-dynamic";

/**
 * Safe for the browser: whether verification email is sent via SES or only logged (dev).
 */
export function GET() {
  return NextResponse.json(getEmailClientHint());
}
