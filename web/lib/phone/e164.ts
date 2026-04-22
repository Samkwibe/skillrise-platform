import { parsePhoneNumber } from "libphonenumber-js";

/**
 * Best-effort parse to E.164. Defaults to US for numbers without a country code.
 */
export function parseToE164(input: string, defaultCountry: "US" = "US"): string | null {
  const raw = input.trim();
  if (!raw) return null;
  try {
    const n = parsePhoneNumber(raw, defaultCountry);
    if (!n?.isValid()) return null;
    return n.number;
  } catch {
    return null;
  }
}

/**
 * Public-safe display (last 4 only), works for any E.164 length.
 */
export function maskPhoneE164(e164: string): string {
  const d = e164.replace(/\D/g, "");
  if (d.length < 4) return "••••";
  return `(•••) •••-${d.slice(-4)}`;
}
