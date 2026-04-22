import bcrypt from "bcryptjs";

const ROUNDS = 12;

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, ROUNDS);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  if (!hash) return false;
  if (hash.startsWith("$2")) return bcrypt.compare(plain, hash);
  // Legacy plaintext fallback (seed data). Never hits in production because seed now hashes.
  return plain === hash;
}
