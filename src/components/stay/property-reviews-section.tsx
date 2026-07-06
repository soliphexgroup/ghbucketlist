import Image from "next/image";
import { Star } from "lucide-react";
import type { CategoryRatings, PropertyReview } from "@/lib/stay-types";

const categoryLabels: { key: keyof CategoryRatings; label: string }[] = [
  { key: "cleanliness", label: "Cleanliness" },
  { key: "accuracy", label: "Accuracy" },
  { key: "communication", label: "Communication" },
  { key: "location", label: "Location" },
  { key: "value", label: "Value" },
];

export function PropertyReviewsSection({
  rating,
  reviewCount,
  categoryRatings,
  reviews,
}: {
  rating: number;
  reviewCount: number;
  categoryRatings: CategoryRatings;
  reviews: PropertyReview[];
}) {
  return (
    <section>
      <h2 className="font-heading text-xl font-semibold text-foreground">Reviews</h2>

      <div className="mt-4 flex flex-col gap-6 sm:flex-row sm:items-start">
        <div className="flex items-center gap-3">
          <span className="font-heading text-4xl font-bold text-foreground">{rating.toFixed(1)}</span>
          <div>
            <div className="flex gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className={i < Math.round(rating) ? "size-4 fill-brand-gold text-brand-gold" : "size-4 text-border"} />
              ))}
            </div>
            <p className="mt-0.5 text-sm text-muted-foreground">{reviewCount} reviews</p>
          </div>
        </div>

        <div className="grid flex-1 grid-cols-1 gap-2 sm:grid-cols-2">
          {categoryLabels.map(({ key, label }) => (
            <div key={key} className="flex items-center justify-between gap-3 text-sm">
              <span className="text-muted-foreground">{label}</span>
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-brand-gold" style={{ width: `${(categoryRatings[key] / 5) * 100}%` }} />
                </div>
                <span className="w-6 text-right text-foreground">{categoryRatings[key].toFixed(1)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-6">
        {reviews.map((review) => (
          <div key={review.id} className="flex gap-3 border-b border-border pb-6 last:border-0">
            <Image src={review.userAvatar} alt={review.userName} width={40} height={40} className="size-10 shrink-0 rounded-full object-cover" />
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-foreground">{review.userName}</p>
                <span className="text-xs text-muted-foreground">
                  {new Date(review.date).toLocaleDateString("en-GB", { month: "short", year: "numeric" })}
                </span>
              </div>
              <div className="mt-1 flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={i < review.rating ? "size-3.5 fill-brand-gold text-brand-gold" : "size-3.5 text-border"} />
                ))}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{review.text}</p>
            </div>
          </div>
        ))}
        {reviews.length === 0 && (
          <p className="text-sm text-muted-foreground">No reviews yet — be the first to stay here.</p>
        )}
      </div>
    </section>
  );
}
