import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function StarRating({
  rating,
  reviewCount,
  size = "sm",
  inverted = false,
  className,
}: {
  rating: number;
  reviewCount?: number;
  size?: "sm" | "md";
  inverted?: boolean;
  className?: string;
}) {
  const isNew = reviewCount !== undefined && reviewCount < 3;
  const starSize = size === "md" ? "size-4.5" : "size-3.5";

  if (isNew) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 text-xs font-medium",
          inverted ? "text-white" : "text-brand-coral",
          className
        )}
      >
        <Star className={cn(starSize, "fill-brand-gold text-brand-gold")} />
        New
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-sm",
        inverted ? "text-white" : "text-foreground",
        className
      )}
    >
      <Star className={cn(starSize, "fill-brand-gold text-brand-gold")} />
      <span className="font-medium">{rating.toFixed(1)}</span>
      {reviewCount !== undefined && (
        <span className={inverted ? "text-white/70" : "text-muted-foreground"}>
          ({reviewCount})
        </span>
      )}
    </span>
  );
}
