"use client";

import Image from "next/image";
import { formatScore, scoreLabel, toScore10 } from "@/lib/review-score";
import { useListingReviews } from "@/lib/db-reviews";
import type { CategoryRatings } from "@/lib/stay-types";

const categoryLabels: { key: keyof CategoryRatings; label: string }[] = [
  { key: "cleanliness", label: "Cleanliness" },
  { key: "accuracy", label: "Accuracy" },
  { key: "communication", label: "Communication" },
  { key: "location", label: "Location" },
  { key: "value", label: "Value" },
];

export function PropertyReviewsSection({ listingId }: { listingId: string }) {
  const reviews = useListingReviews(listingId);
  const reviewCount = reviews.length;
  const rating = reviewCount > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviewCount : 0;
  const score = toScore10(rating);

  // Average each sub-score across reviews that provided category ratings; hide the grid if none did.
  const withCats = reviews.filter((r) => r.categoryRatings);
  const categoryAverages: Partial<CategoryRatings> = {};
  if (withCats.length > 0) {
    for (const { key } of categoryLabels) {
      const vals = withCats
        .map((r) => (r.categoryRatings as CategoryRatings)[key])
        .filter((v) => typeof v === "number");
      if (vals.length > 0) categoryAverages[key] = vals.reduce((s, v) => s + v, 0) / vals.length;
    }
  }
  const hasCategories = Object.keys(categoryAverages).length > 0;

  return (
    <section>
      <h2 className="font-heading text-xl font-semibold text-foreground">Guest reviews</h2>

      {reviewCount > 0 && (
        <div className="mt-4 flex flex-col gap-6 sm:flex-row sm:items-start">
          <div className="flex shrink-0 items-center gap-3">
            <span className="rounded-lg rounded-bl-none bg-primary px-3 py-2 font-heading text-2xl font-bold text-primary-foreground">
              {formatScore(score)}
            </span>
            <div>
              <p className="font-heading text-base font-semibold text-foreground">{scoreLabel(score)}</p>
              <p className="text-sm text-muted-foreground">{reviewCount} reviews</p>
            </div>
          </div>

          {hasCategories && (
            <div className="grid flex-1 grid-cols-1 gap-2 sm:grid-cols-2">
              {categoryLabels
                .filter(({ key }) => categoryAverages[key] !== undefined)
                .map(({ key, label }) => (
                  <div key={key} className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-muted-foreground">{label}</span>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${(categoryAverages[key]! / 5) * 100}%` }}
                        />
                      </div>
                      <span className="w-6 text-right text-foreground">
                        {formatScore(toScore10(categoryAverages[key]!))}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      <div className="mt-8 flex flex-col gap-6">
        {reviews.map((review) => (
          <div key={review.id} className="flex gap-3 border-b border-border pb-6 last:border-0">
            <Image
              src={review.userAvatar}
              alt={review.userName}
              width={40}
              height={40}
              className="size-10 shrink-0 rounded-full object-cover"
            />
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-foreground">{review.userName}</p>
                <span className="text-xs text-muted-foreground">
                  {new Date(review.date).toLocaleDateString("en-GB", { month: "short", year: "numeric" })}
                </span>
                <span className="rounded rounded-bl-none bg-primary px-1.5 py-0.5 font-heading text-xs font-bold text-primary-foreground">
                  {formatScore(toScore10(review.rating))}
                </span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{review.text}</p>
            </div>
          </div>
        ))}
        {reviewCount === 0 && (
          <p className="text-sm text-muted-foreground">No reviews yet — be the first to stay here.</p>
        )}
      </div>
    </section>
  );
}
