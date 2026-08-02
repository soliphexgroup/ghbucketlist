"use client";

import { StarRating } from "@/components/star-rating";
import { useListingRating } from "@/lib/db-reviews";

/** Star rating for a listing, computed from real reviews. Shows "New" until it has reviews. */
export function ListingRatingStars({
  listingId,
  size,
  inverted,
  className,
}: {
  listingId: string;
  size?: "sm" | "md";
  inverted?: boolean;
  className?: string;
}) {
  const agg = useListingRating(listingId);
  return (
    <StarRating
      rating={agg?.rating ?? 0}
      reviewCount={agg?.count ?? 0}
      size={size}
      inverted={inverted}
      className={className}
    />
  );
}
