import type { Certificate, Enrollment } from "@/lib/store";
import { store } from "@/lib/store";

/**
 * The in-process `store` is still read by some server pages; keep it aligned when persisting outside the memory adapter.
 */
export function mirrorEnrollmentToStore(e: Enrollment) {
  const i = store.enrollments.findIndex((x) => x.userId === e.userId && x.trackSlug === e.trackSlug);
  if (i >= 0) store.enrollments[i] = e;
  else store.enrollments.push(e);
}

export function mirrorCertificateToStore(c: Certificate) {
  if (!store.certificates.some((x) => x.id === c.id)) store.certificates.push(c);
}
