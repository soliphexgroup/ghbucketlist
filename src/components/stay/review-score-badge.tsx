import { Star } from "lucide-react";
import { formatScore, scoreLabel, toScore10 } from "@/lib/review-score";
import { cn } from "@/lib/utils";

/**
 * Stays present ratings as a score out of 10. Under a few reviews a score is
 * noise (one 5-star review would read "10 Superb"), so those show "New" instead.
 */
export function ReviewScoreBadge({
  rating,
  reviewCount,
  compact = false,
  className,
}: {
  rating: number;
  reviewCount?: number;
  /** Cards are narrow: drop the word label and keep the score box. */
  compact?: boolean;
  className?: string;
}) {
  const isNew = reviewCount !== undefined && reviewCount < 3;

  if (isNew) {
    return (
      <span className={cn("inline-flex items-center gap-1 text-xs font-medium text-brand-coral", className)}>
        <Star className="size-3.5 fill-brand-gold text-brand-gold" />
        New
      </span>
    );
  }

  const score = toScore10(rating);

  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span className="rounded-md rounded-bl-none bg-primary px-1.5 py-1 font-heading text-sm font-bold text-primary-foreground">
        {formatScore(score)}
      </span>
      {compact ? (
        reviewCount !== undefined && (
          <span className="text-xs text-muted-foreground">{reviewCount} reviews</span>
        )
      ) : (
        <span className="flex flex-col leading-tight">
          <span className="text-sm font-semibold text-foreground">{scoreLabel(score)}</span>
          {reviewCount !== undefined && (
            <span className="text-xs text-muted-foreground">{reviewCount} reviews</span>
          )}
        </span>
      )}
    </span>
  );
}
