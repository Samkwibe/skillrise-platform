import { getDb } from "@/lib/db";
import { getTrack, store } from "@/lib/store";
import { ensureTracksFromDatabase } from "@/lib/course/ensure-tracks";

export type ThankYouListItem = {
  id: string;
  fromName: string;
  message: string;
  at: number;
  trackTitle?: string;
};

export type CommunityImpact = {
  trackSlugs: string[];
  studentsHelped: number;
  /** Certificates your learners earned in your tracks. */
  certificatesEarned: number;
  /** Applications marked hired where the job required one of your tracks. */
  jobPlacements: number;
  /** Unique learners who RSVP’d or attended at least one of your live sessions (seed + store). */
  liveLearnersTouched: number;
  thankYous: ThankYouListItem[];
};

/**
 * Aggregates enrollments, certificates, job outcomes, and demo thank-yous for a teacher.
 * Works with the memory + Mongo + Dynamo DB adapters the same way as at-risk heuristics.
 */
export async function getCommunityImpactForTeacher(teacherId: string): Promise<CommunityImpact> {
  await ensureTracksFromDatabase();
  const myTracks = store.tracks.filter((t) => t.teacherId === teacherId);
  const trackSlugs = myTracks.map((t) => t.slug);
  const slugSet = new Set(trackSlugs);
  if (trackSlugs.length === 0) {
    return {
      trackSlugs: [],
      studentsHelped: 0,
      certificatesEarned: 0,
      jobPlacements: 0,
      liveLearnersTouched: 0,
      thankYous: [],
    };
  }

  const db = getDb();
  const studentIds = new Set<string>();
  for (const slug of trackSlugs) {
    const enr = await db.listEnrollmentsByTrack(slug);
    for (const e of enr) studentIds.add(e.userId);
  }
  const studentsHelped = studentIds.size;

  let certificatesEarned = 0;
  for (const uid of studentIds) {
    const certs = await db.listCertificates(uid);
    certificatesEarned += certs.filter((c) => slugSet.has(c.trackSlug)).length;
  }

  let applications = await db.listApplications({});
  if (applications.length === 0 && db.kind === "dynamodb") {
    applications = store.applications;
  }
  let jobPlacements = 0;
  for (const a of applications) {
    if (a.status !== "hired") continue;
    const job = await db.getJob(a.jobId);
    if (job?.requiredTrackSlug && slugSet.has(job.requiredTrackSlug)) jobPlacements += 1;
  }

  const liveLearnersTouched = new Set<string>();
  for (const s of store.liveSessions) {
    if (s.teacherId !== teacherId) continue;
    for (const uid of s.attendees) {
      if (studentIds.has(uid)) liveLearnersTouched.add(uid);
    }
  }

  const thankYous: ThankYouListItem[] = store.teacherThankYous
    .filter((t) => t.teacherId === teacherId)
    .map((t) => {
      const u = store.users.find((x) => x.id === t.fromUserId);
      const tr = t.trackSlug ? getTrack(t.trackSlug) : undefined;
      return {
        id: t.id,
        fromName: u?.name ?? "Learner",
        message: t.message,
        at: t.at,
        trackTitle: tr?.title,
      };
    })
    .sort((a, b) => b.at - a.at);

  return {
    trackSlugs,
    studentsHelped,
    certificatesEarned,
    jobPlacements,
    liveLearnersTouched: liveLearnersTouched.size,
    thankYous,
  };
}
