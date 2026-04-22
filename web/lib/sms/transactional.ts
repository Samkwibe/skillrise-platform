/**
 * SMS delivery for phone verification. Mirrors email/transactional patterns.
 *
 * SMS_MODE=dev|twilio|sns — default: dev in dev; with Twilio creds can auto-pick twilio when unset.
 * Use SMS_MODE=sns for Amazon SNS SMS (OTP) in production with an AWS account / origination setup.
 */

import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";

function resolveMode(): "dev" | "twilio" | "sns" {
  const m = (process.env.SMS_MODE || "").toLowerCase().trim();
  if (m === "dev" || m === "log" || m === "console") return "dev";
  if (m === "sns") return "sns";
  if (m === "twilio") return "twilio";
  if (m === "off" || m === "disabled" || m === "none") return "dev";
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) return "twilio";
  return "dev";
}

function snsRegion(): string {
  return (process.env.AWS_SNS_REGION || process.env.AWS_REGION || "us-east-1").trim();
}

export function isSmsSendConfigured(): boolean {
  const m = (process.env.SMS_MODE || "").toLowerCase().trim();
  if (m === "off" || m === "disabled" || m === "none") return false;
  return true;
}

export function willSmsActuallySend(): boolean {
  const mode = resolveMode();
  if (mode === "dev") return false;
  if (mode === "sns") return true;
  if (mode === "twilio") {
    const sid = process.env.TWILIO_ACCOUNT_SID?.trim();
    const token = process.env.TWILIO_AUTH_TOKEN?.trim();
    const from = process.env.TWILIO_SMS_FROM?.trim();
    const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID?.trim();
    return Boolean(sid && token && (messagingServiceSid || from));
  }
  return false;
}

/**
 * When SMS is log-only (dev), optional URL for testers using public “receive SMS online” inboxes.
 * Server use only; may be returned to the client in development.
 */
export function getDevTemporarySmsInboxUrl(): string | undefined {
  if (process.env.NODE_ENV !== "development" || willSmsActuallySend()) return undefined;
  const u = process.env.RECEIVESMS_DEV_URL?.trim();
  return u || "https://receivesms.me";
}

export async function sendVerificationSms(e164: string, code: string): Promise<void> {
  const off = (process.env.SMS_MODE || "").toLowerCase().trim();
  if (off === "off" || off === "disabled" || off === "none") {
    throw new Error("sms_disabled");
  }
  const body = `SkillRise: Your verification code is ${code}. It expires in 10 minutes.`;
  const mode = resolveMode();
  if (mode === "dev") {
    // eslint-disable-next-line no-console
    console.info("[sms:dev] to=%s\n%s", e164, body);
    return;
  }
  if (mode === "sns") {
    const region = snsRegion();
    const client = new SNSClient({ region });
    try {
      const out = await client.send(
        new PublishCommand({
          PhoneNumber: e164,
          Message: body,
        }),
      );
      // eslint-disable-next-line no-console
      console.info("[sms:sns] sent MessageId=%s to=%s region=%s", out.MessageId ?? "?", e164, region);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      // eslint-disable-next-line no-console
      console.error("[sms:sns] Publish failed region=%s to=%s: %s", region, e164, msg);
      throw new Error(
        `SNS SMS failed (${region}): ${msg}. Check IAM (sns:Publish), origination, spend limits, and opt-out lists.`,
      );
    }
    return;
  }
  const sid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const token = process.env.TWILIO_AUTH_TOKEN?.trim();
  const from = process.env.TWILIO_SMS_FROM?.trim();
  const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID?.trim();
  if (!sid || !token) {
    // eslint-disable-next-line no-console
    console.info("[sms:missing-twilio] to=%s\n%s", e164, body);
    return;
  }
  const auth = Buffer.from(`${sid}:${token}`).toString("base64");
  const p = new URLSearchParams();
  p.set("To", e164);
  if (messagingServiceSid) {
    p.set("MessagingServiceSid", messagingServiceSid);
  } else {
    if (!from) {
      // eslint-disable-next-line no-console
      console.error("[sms] set TWILIO_SMS_FROM or TWILIO_MESSAGING_SERVICE_SID");
      return;
    }
    p.set("From", from);
  }
  p.set("Body", body);
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(sid)}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: p,
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`twilio_sms: ${res.status} ${t.slice(0, 200)}`);
  }
}
