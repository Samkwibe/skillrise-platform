import { getDb } from "@/lib/db";
import { store } from "@/lib/store";
import { mirrorCertificateToStore, mirrorEnrollmentToStore } from "@/lib/course/enrollment-store";
import type { User } from "@/lib/store";

/**
 * Merges DB enrollments (and teacher-visible enrollments, certificates) into the in-memory `store`
 * so legacy components that read `store.enrollments` stay correct when DATA_STORE is Mongo/Dynamo.
 * Safe to call once per request; memory adapter is a no-op.
 */
export async function ensureEnrollmentStoreFromDatabase(user: User): Promise<void> {
  const db = getDb();
  if (db.kind === "memory") return;
  try {
    await db.ready();

    const mine = await db.listEnrollments(user.id);
    for (const e of mine) mirrorEnrollmentToStore(e);

    const certs = await db.listCertificates(user.id);
    for (const c of certs) mirrorCertificateToStore(c);

    if (user.role === "teacher") {
      const trackSlugs = store.tracks.filter((t) => t.teacherId === user.id).map((t) => t.slug);
      const seen = new Set(mine.map((e) => `${e.userId}::${e.trackSlug}`));
      for (const slug of trackSlugs) {
        const batch = await db.listEnrollmentsByTrack(slug);
        for (const e of batch) {
          const k = `${e.userId}::${e.trackSlug}`;
          if (seen.has(k)) continue;
          seen.add(k);
          mirrorEnrollmentToStore(e);
        }
      }
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("[enrollments] ensureEnrollmentStoreFromDatabase failed; using in-memory store only", e);
  }
}
