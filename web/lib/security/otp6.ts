import { randomInt } from "node:crypto";

export const OTP6_TTL_MS = 10 * 60 * 1000;

export function generateOtp6(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}
