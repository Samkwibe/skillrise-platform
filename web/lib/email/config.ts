/**
 * How verification / transactional emails are delivered. Used for UI hints and logging.
 * Does not expose secrets.
 */
export type AuthEmailDispatch = "dev" | "ses" | "unknown";

export function getAuthEmailModeRaw(): string {
  return (process.env.AUTH_EMAIL_MODE || "dev").toLowerCase().trim();
}

/** What the app will actually do for sendTransactionalEmail. */
export function getAuthEmailDispatch(): AuthEmailDispatch {
  const mode = getAuthEmailModeRaw();
  if (mode === "dev" || mode === "log" || mode === "console") return "dev";
  if (mode === "ses") return "ses";
  return "unknown";
}

/** For client: whether mail is only logged (dev) vs sent by SES. */
export function getEmailClientHint(): { delivery: "console" | "ses" | "unknown" } {
  const d = getAuthEmailDispatch();
  if (d === "ses") return { delivery: "ses" };
  if (d === "dev") return { delivery: "console" };
  return { delivery: "unknown" };
}
