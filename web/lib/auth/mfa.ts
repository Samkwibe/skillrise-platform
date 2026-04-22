/**
 * Optional multi-factor authentication — extension points only.
 * Login, sessions, and Google OAuth are unchanged until MFA is implemented.
 *
 * **Phase 1 (planned):** second factor via one-time code over email and/or SMS.
 * **Phase 2 (planned):** TOTP (Google Authenticator–style) using a per-user secret stored server-side
 *   (never exposed in `publicUser`).
 *
 * User flags on `User` (see `lib/store.ts`): `mfaEnabled`, `mfaEmailOtpEnabled`, `mfaSmsOtpEnabled`, `mfaTotpEnabled`.
 * When implementing, add login step: after password/Google, if `mfaEnabled`, require the chosen second factor
 * before issuing/refreshing the session.
 */
export type MfaPlannedMethod = "email_otp" | "sms_otp" | "totp";

export function mfaFlagsPlaceholder(): { enabled: false } {
  return { enabled: false };
}
