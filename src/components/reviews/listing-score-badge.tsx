"use client";

import { ReviewScoreBadge } from "@/components/stay/review-score-badge";
import { useListingRating } from "@/lib/db-reviews";

/** Stay-style /10 score badge for a listing, computed from real reviews. "New" until it has reviews. */
export function ListingScoreBadge({
  listingId,
  compact,
  className,
}: {
  listingId: string;
  compact?: boolean;
  className?: string;
}) {
  const agg = useListingRating(listingId);
  return (
    <ReviewScoreBadge
      rating={agg?.rating ?? 0}
      reviewCount={agg?.count ?? 0}
      compact={compact}
      className={className}
    />
  );
}
