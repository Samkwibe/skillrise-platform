/**
 * User-Agent for public APIs that ask for contact info (Wikipedia, OpenAlex, etc.).
 */
export function externalApisUserAgent(): string {
  const contact = process.env.CONTACT_EMAIL_FOR_APIS?.trim() || "https://github.com/vercel/next.js";
  return `SkillRise/1.0 (education; contact: ${contact})`;
}
