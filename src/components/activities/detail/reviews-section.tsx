import Image from "next/image";
import Link from "next/link";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Review } from "@/lib/types";

export function ReviewsSection({
  rating,
  reviewCount,
  reviews,
}: {
  rating: number;
  reviewCount: number;
  reviews: Review[];
}) {
  const breakdown = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => Math.round(r.rating) === star).length,
  }));

  return (
    <section>
      <h2 className="font-heading text-xl font-semibold text-foreground">Reviews</h2>

      <div className="mt-4 flex flex-col gap-6 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <span className="font-heading text-4xl font-bold text-foreground">
            {rating.toFixed(1)}
          </span>
          <div>
            <div className="flex gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={
                    i < Math.round(rating)
                      ? "size-4 fill-brand-gold text-brand-gold"
                      : "size-4 text-border"
                  }
                />
              ))}
            </div>
            <p className="mt-0.5 text-sm text-muted-foreground">{reviewCount} reviews</p>
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-1.5">
          {breakdown.map(({ star, count }) => (
            <div key={star} className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="w-3">{star}</span>
              <Star className="size-3 fill-brand-gold text-brand-gold" />
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-brand-gold"
                  style={{
                    width: reviews.length ? `${(count / reviews.length) * 100}%` : "0%",
                  }}
                />
              </div>
              <span className="w-4 text-right">{count}</span>
            </div>
          ))}
        </div>
      </div>

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
                  {new Date(review.date).toLocaleDateString("en-GB", {
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
              <div className="mt-1 flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={
                      i < review.rating
                        ? "size-3.5 fill-brand-gold text-brand-gold"
                        : "size-3.5 text-border"
                    }
                  />
                ))}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{review.text}</p>
            </div>
          </div>
        ))}

        {reviews.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No reviews yet — be the first to share your experience.
          </p>
        )}
      </div>

      <Button variant="outline" asChild className="mt-6">
        <Link href="/login">Write a review</Link>
      </Button>
    </section>
  );
}
