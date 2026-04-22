/** How long a password-reset link remains valid (default 1 h, max 24 h, min 5 m). */
export function passwordResetTtlMs(): number {
  const n = Number(process.env.PASSWORD_RESET_TTL_MS ?? "3600000");
  if (!Number.isFinite(n)) return 60 * 60 * 1000;
  return Math.min(24 * 60 * 60 * 1000, Math.max(5 * 60 * 1000, n));
}
