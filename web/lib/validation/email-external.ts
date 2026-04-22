/**
 * External email validation for signup: MailSniper (primary) + Bloombox (fallback, no key).
 * Server-only; never expose API keys to the client.
 */

const MAILSNIPER_VERIFY = "https://api.mailsniperapp.com/v1/verify/email";
const BLOOMBOX_DEFAULT = "https://rapid-email-verifier.fly.dev/api/validate";

type MailsniperBody = {
  is_valid?: boolean;
  is_disposable?: boolean;
  is_spam?: boolean;
  risk?: number;
  error_code?: string;
  message?: string;
};

type BloomboxBody = {
  email?: string;
  status?: string;
  score?: number;
  validations?: {
    syntax?: boolean;
    mx_records?: boolean;
    is_disposable?: boolean;
    is_role_based?: boolean;
  };
};

export type SignupEmailValidationResult =
  | { ok: true; source: "mailsniper" | "bloombox" | "skipped" }
  | { ok: false; reason: string; source: "mailsniper" | "bloombox" };

function applyMailsniperPolicy(d: MailsniperBody): { ok: true } | { ok: false; reason: string } {
  if (d.is_valid === false) {
    return { ok: false, reason: "That email address does not look valid. Check spelling and try again." };
  }
  if (d.is_disposable === true) {
    return { ok: false, reason: "Please use a permanent email address, not a disposable or temporary one." };
  }
  if (d.is_spam === true) {
    return { ok: false, reason: "This email domain is not allowed. Try another address." };
  }
  if (typeof d.risk === "number" && d.risk >= 71) {
    return { ok: false, reason: "This email could not be accepted. Try a different address or contact support." };
  }
  return { ok: true };
}

function applyBloomboxPolicy(d: BloomboxBody): { ok: true } | { ok: false; reason: string } {
  const st = d.status?.toUpperCase() ?? "";
  if (st === "VALID") {
    if (d.validations?.is_disposable) {
      return { ok: false, reason: "Please use a permanent email address, not a disposable or temporary one." };
    }
    return { ok: true };
  }
  if (st === "INVALID_FORMAT" || d.validations?.syntax === false) {
    return { ok: false, reason: "Enter a valid email address." };
  }
  return { ok: false, reason: "That email could not be accepted. Try a different address." };
}

async function tryMailsniper(
  email: string,
  apiKey: string,
): Promise<
  { kind: "ok"; data: MailsniperBody } | { kind: "auth" } | { kind: "fallback" } | { kind: "bad_request"; data: MailsniperBody }
> {
  const url = `${MAILSNIPER_VERIFY}/${encodeURIComponent(email)}`;
  let res: Response;
  try {
    res = await fetch(url, {
      headers: { Authorization: `Bearer ${apiKey}`, Accept: "application/json" },
      cache: "no-store",
    });
  } catch {
    return { kind: "fallback" };
  }
  if (res.status === 401 || res.status === 403) {
    return { kind: "auth" };
  }
  if (res.status === 429) {
    return { kind: "fallback" };
  }
  if (res.status >= 500) {
    return { kind: "fallback" };
  }
  let data: MailsniperBody;
  try {
    data = (await res.json()) as MailsniperBody;
  } catch {
    return { kind: "fallback" };
  }
  if (res.status === 400) {
    return { kind: "bad_request", data };
  }
  if (!res.ok) {
    if (data.error_code === "quota_exceeded" || /quota/i.test(data.message ?? "")) {
      return { kind: "fallback" };
    }
    return { kind: "fallback" };
  }
  return { kind: "ok", data };
}

async function tryBloombox(email: string, endpoint: string): Promise<
  { kind: "ok"; data: BloomboxBody } | { kind: "fail" }
> {
  let res: Response;
  try {
    res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ email }),
      cache: "no-store",
    });
  } catch {
    return { kind: "fail" };
  }
  if (!res.ok) {
    return { kind: "fail" };
  }
  let data: BloomboxBody;
  try {
    data = (await res.json()) as BloomboxBody;
  } catch {
    return { kind: "fail" };
  }
  return { kind: "ok", data };
}

/**
 * Balanced policy: block invalid, disposable, spam, and very high risk (MailSniper).
 * Bloombox when no MailSniper key, or on quota/network failure after MailSniper.
 */
export async function validateEmailForSignup(email: string): Promise<SignupEmailValidationResult> {
  if (process.env.SKIP_EMAIL_EXTERNAL_VALIDATION === "1") {
    return { ok: true, source: "skipped" };
  }
  const normalized = email.trim().toLowerCase();
  if (!normalized || !normalized.includes("@")) {
    return { ok: false, reason: "Enter a valid email address.", source: "mailsniper" };
  }

  const bloomboxUrl = (process.env.BLOOMBOX_EMAIL_VALIDATE_URL || BLOOMBOX_DEFAULT).trim();
  const apiKey = process.env.MAILSNIPER_API_KEY?.trim();

  if (apiKey) {
    const ms = await tryMailsniper(normalized, apiKey);
    if (ms.kind === "auth") {
      return { ok: false, reason: "Email validation is misconfigured (check MAILSNIPER_API_KEY).", source: "mailsniper" };
    }
    if (ms.kind === "bad_request") {
      return { ok: false, reason: "Enter a valid email address.", source: "mailsniper" };
    }
    if (ms.kind === "ok") {
      const r = applyMailsniperPolicy(ms.data);
      if (!r.ok) {
        return { ...r, source: "mailsniper" };
      }
      return { ok: true, source: "mailsniper" };
    }
  }

  const bb = await tryBloombox(normalized, bloomboxUrl);
  if (bb.kind === "ok") {
    const r = applyBloomboxPolicy(bb.data);
    if (!r.ok) {
      return { ...r, source: "bloombox" };
    }
    return { ok: true, source: "bloombox" };
  }
  return {
    ok: false,
    reason: "We could not verify that email right now. Try again in a few minutes.",
    source: "bloombox",
  };
}
