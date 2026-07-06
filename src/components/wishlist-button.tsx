"use client";

import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { toggleWishlist, useIsWishlisted } from "@/lib/wishlist-store";

export function WishlistButton({
  experienceId,
  className,
}: {
  experienceId: string;
  className?: string;
}) {
  const saved = useIsWishlisted(experienceId);

  function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(experienceId);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={saved ? "Remove from wishlist" : "Add to wishlist"}
      aria-pressed={saved}
      className={cn(
        "flex size-9 items-center justify-center rounded-full bg-white/90 text-foreground shadow-sm transition-colors duration-200 hover:bg-white",
        className
      )}
    >
      <Heart
        className={cn(
          "size-4.5 transition-colors duration-200",
          saved ? "fill-primary text-primary" : "text-foreground"
        )}
      />
    </button>
  );
}
