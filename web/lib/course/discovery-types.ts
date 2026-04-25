/** Learner discovery: course reviews, wishlist, and aggregated display stats. */

export type CourseReviewRecord = {
  id: string;
  trackSlug: string;
  userId: string;
  /** 1–5 */
  rating: number;
  body: string;
  helpfulCount: number;
  /** User ids who marked helpful (one vote per user). */
  helpfulVoterIds: string[];
  instructorReply?: string;
  instructorRepliedAt?: number;
  createdAt: number;
};

export type CourseWishlistEntry = {
  userId: string;
  trackSlug: string;
  createdAt: number;
};

export type TrackReviewStats = {
  averageRating: number;
  reviewCount: number;
  ratingDistribution: { stars: 1 | 2 | 3 | 4 | 5; count: number }[];
};
