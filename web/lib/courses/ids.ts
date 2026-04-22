import { createHash } from "node:crypto";

export function stableCourseId(provider: string, url: string): string {
  return createHash("sha1").update(`${provider}\0${url}`).digest("hex").slice(0, 16);
}
