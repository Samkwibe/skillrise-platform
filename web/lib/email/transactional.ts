import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { getAuthEmailDispatch, getAuthEmailModeRaw } from "@/lib/email/config";

const APP_BASE =
  process.env.APP_BASE_URL?.replace(/\/$/, "") ||
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
  "http://localhost:3000";

let configWarningLogged = false;

function logEmailModeOnce(): void {
  if (configWarningLogged) return;
  configWarningLogged = true;
  const mode = getAuthEmailModeRaw();
  const dispatch = getAuthEmailDispatch();
  if (dispatch === "dev") {
    // eslint-disable-next-line no-console
    console.warn(
      "[email] AUTH_EMAIL_MODE=%s — messages are not delivered to inboxes; they only go to the server log. " +
        "Set AUTH_EMAIL_MODE=ses, AWS_SES_FROM, and verify the identity in the same region as the SES client to send real email.",
      mode || "dev",
    );
  } else if (dispatch === "unknown") {
    // eslint-disable-next-line no-console
    console.warn(
      "[email] AUTH_EMAIL_MODE=%s is not recognized. Only dev|log|console|ses are supported; falling back to log-only behavior.",
      mode,
    );
  } else {
    const region = process.env.AWS_SES_REGION || process.env.AWS_REGION || "us-east-1";
    // eslint-disable-next-line no-console
    console.info("[email] AUTH_EMAIL_MODE=ses — sending via Amazon SES in region %s", region);
  }
}

export function appBaseUrl(): string {
  return APP_BASE;
}

function sesRegion(): string {
  return (process.env.AWS_SES_REGION || process.env.AWS_REGION || "us-east-1").trim();
}

type SendArgs = {
  to: string;
  subject: string;
  textBody: string;
  htmlBody?: string;
};

/**
 * AUTH_EMAIL_MODE=dev|log|console (default): log only, no inbox delivery.
 * AUTH_EMAIL_MODE=ses: send via Amazon SES.
 *
 * SES identity (domain or email) must be verified in the same region you use for the client
 * (AWS_SES_REGION or AWS_REGION). Production sending requires the account to be out of the SES sandbox
 * or the recipient must be a verified address in the sandbox.
 */
export async function sendTransactionalEmail(args: SendArgs): Promise<void> {
  const mode = (process.env.AUTH_EMAIL_MODE || "dev").toLowerCase().trim();
  logEmailModeOnce();

  if (mode === "dev" || mode === "log" || mode === "console") {
    if (
      process.env.NODE_ENV === "production" &&
      process.env.EMAIL_STRICT_PRODUCTION === "1"
    ) {
      throw new Error(
        "Refusing to log-only email in production: set AUTH_EMAIL_MODE=ses, AWS_SES_FROM, and verified SES identity (or unset EMAIL_STRICT_PRODUCTION to allow this temporarily).",
      );
    }
    if (process.env.NODE_ENV === "production") {
      // eslint-disable-next-line no-console
      console.error(
        "[email] PRODUCTION: AUTH_EMAIL_MODE is not ses — no inbox delivery. Set AUTH_EMAIL_MODE=ses and SES credentials.",
      );
    }
    // eslint-disable-next-line no-console
    console.info(
      "[email:%s] to=%s subject=%s\n%s",
      mode,
      args.to,
      args.subject,
      args.textBody.slice(0, 2000),
    );
    return;
  }

  if (mode !== "ses") {
    // eslint-disable-next-line no-console
    console.warn("[email] unknown AUTH_EMAIL_MODE=%s; logging only", mode);
    // eslint-disable-next-line no-console
    console.info("[email] to=%s subject=%s\n%s", args.to, args.subject, args.textBody.slice(0, 2000));
    return;
  }

  const from = process.env.AWS_SES_FROM?.trim();
  if (!from) {
    throw new Error(
      "AWS_SES_FROM is required when AUTH_EMAIL_MODE=ses (use a verified identity, e.g. 'SkillRise <verify@example.com>')",
    );
  }

  const region = sesRegion();
  const client = new SESClient({ region });
  try {
    const out = await client.send(
      new SendEmailCommand({
        Source: from,
        Destination: { ToAddresses: [args.to] },
        Message: {
          Subject: { Data: args.subject, Charset: "UTF-8" },
          Body: {
            Text: { Data: args.textBody, Charset: "UTF-8" },
            ...(args.htmlBody
              ? { Html: { Data: args.htmlBody, Charset: "UTF-8" } }
              : {}),
          },
        },
      }),
    );
    // eslint-disable-next-line no-console
    console.info("[email:ses] sent MessageId=%s to=%s region=%s", out.MessageId ?? "?", args.to, region);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    // eslint-disable-next-line no-console
    console.error("[email:ses] SendEmail failed region=%s from=%s to=%s: %s", region, from, args.to, msg);
    throw new Error(
      `SES SendEmail failed (${region}): ${msg}. Ensure the From identity is verified in this region, ` +
        `IAM allows ses:SendEmail, and (if still in sandbox) the recipient is verified or the account is out of sandbox.`,
    );
  }
}

export async function sendEmailVerificationEmail(to: string, email: string, rawToken: string) {
  const q = new URLSearchParams({ email, token: rawToken });
  const link = `${APP_BASE}/verify-email?${q.toString()}`;
  const subject = "Verify your SkillRise email";
  const textBody = `Hi — confirm this address to finish securing your SkillRise account.\n\n${link}\n\nIf you didn’t create an account, you can ignore this message.`;
  const htmlBody = `<p>Hi — confirm this address to finish securing your SkillRise account.</p><p><a href="${link}">Verify email</a></p><p>If you didn’t create an account, you can ignore this message.</p>`;
  await sendTransactionalEmail({ to, subject, textBody, htmlBody });
}

export async function sendPasswordResetEmail(to: string, email: string, rawToken: string) {
  const q = new URLSearchParams({ email, token: rawToken });
  const link = `${APP_BASE}/reset-password?${q.toString()}`;
  const subject = "Reset your SkillRise password";
  const textBody = `We received a request to reset your password.\n\n${link}\n\nThis link expires in one hour. If you didn’t ask for this, you can ignore this email.`;
  const htmlBody = `<p>We received a request to reset your password.</p><p><a href="${link}">Reset password</a></p><p>This link expires in one hour. If you didn’t ask for this, you can ignore this email.</p>`;
  await sendTransactionalEmail({ to, subject, textBody, htmlBody });
}
