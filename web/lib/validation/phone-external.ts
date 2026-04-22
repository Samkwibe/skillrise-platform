/**
 * NumVerify (APILayer) phone validation. Optional: if NUMVERIFY_API_KEY is unset, only
 * local E.164 parsing applies (see callers).
 */

const NUMVERIFY_BASE = "https://apilayer.net/api/validate";

export type PhoneNumverifyResult =
  | { ok: true; line_type?: string; carrier?: string; country_name?: string; country_code?: string }
  | { ok: false; reason: string };

type NumverifySuccess = {
  valid?: boolean;
  line_type?: string;
  carrier?: string;
  country_name?: string;
  country_code?: string;
  success?: boolean;
  error?: { code?: number; type?: string; info?: string };
};

/**
 * When `NUMVERIFY_API_KEY` is set, calls NumVerify. Otherwise returns `{ ok: true }` (skip).
 */
export async function validatePhoneWithNumverify(e164: string): Promise<PhoneNumverifyResult> {
  const key = process.env.NUMVERIFY_API_KEY?.trim();
  if (!key) {
    return { ok: true };
  }
  const number = e164.replace(/\D/g, "");
  if (!number) {
    return { ok: false, reason: "Enter a valid mobile number with country code." };
  }
  const url = new URL(NUMVERIFY_BASE);
  url.searchParams.set("access_key", key);
  url.searchParams.set("number", number);
  let res: Response;
  try {
    res = await fetch(url.toString(), { cache: "no-store" });
  } catch {
    return { ok: false, reason: "Phone validation is temporarily unavailable. Try again shortly." };
  }
  let data: NumverifySuccess;
  try {
    data = (await res.json()) as NumverifySuccess;
  } catch {
    return { ok: false, reason: "Phone validation failed. Try again." };
  }
  if (data.success === false) {
    if (data.error?.code === 429) {
      return { ok: false, reason: "Phone validation is temporarily rate-limited. Try again in a minute." };
    }
    return { ok: false, reason: data.error?.info || "Phone validation failed." };
  }
  if (data.valid !== true) {
    return { ok: false, reason: "This phone number does not look valid. Check the country code and try again." };
  }
  return {
    ok: true,
    line_type: data.line_type,
    carrier: data.carrier,
    country_name: data.country_name,
    country_code: data.country_code,
  };
}
