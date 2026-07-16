import Image from "next/image";
import Link from "next/link";
import { BedDouble, Zap } from "lucide-react";
import type { Property } from "@/lib/stay-types";
import { ReviewScoreBadge } from "@/components/stay/review-score-badge";
import { WishlistButton } from "@/components/wishlist-button";
import { formatGHS } from "@/lib/format";
import { cn } from "@/lib/utils";
import { getPropertyBySlug } from "@/data/properties";

const propertyTypeLabels: Record<Property["propertyType"], string> = {
  hotel: "Hotel",
  apartment: "Apartment",
  vacation: "Vacation Home",
};

export function PropertyCard({
  property,
  className,
  bookingQuery,
}: {
  property: Property;
  className?: string;
  /** Searched dates/guests to carry through, so the booking widget opens pre-filled. */
  bookingQuery?: string;
}) {
  const isStaticProperty = Boolean(getPropertyBySlug(property.slug));
  const base = isStaticProperty
    ? `/stay/${property.slug}`
    : `/stay/preview?slug=${encodeURIComponent(property.slug)}`;
  const href = bookingQuery ? `${base}${base.includes("?") ? "&" : "?"}${bookingQuery}` : base;

  return (
    <Link
      href={href}
      className={cn(
        "group flex w-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-[0_2px_12px_rgba(0,0,0,0.08)] transition-shadow duration-200 hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)]",
        className
      )}
    >
      <div className="relative aspect-4/3 w-full overflow-hidden">
        <Image
          src={property.images[0]}
          alt={property.title}
          fill
          sizes="(min-width: 1024px) 320px, 45vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <span className="absolute top-3 left-3 inline-flex items-center rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-foreground shadow-sm">
          {propertyTypeLabels[property.propertyType]}
        </span>
        <WishlistButton experienceId={property.id} className="absolute top-3 right-3" />
        {property.bookingType === "instant" && (
          <span className="absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground shadow-sm">
            <Zap className="size-3 fill-current" />
            Instant Book
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-3 sm:gap-2 sm:p-4">
        <h3 className="line-clamp-1 font-heading text-sm font-semibold text-foreground sm:text-base">
          {property.title}
        </h3>
        <p className="truncate text-xs text-muted-foreground sm:text-sm">{property.neighbourhood}, {property.city}</p>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground sm:text-sm">
          <BedDouble className="size-3.5 shrink-0" />
          <span className="truncate">{property.bedrooms} bed · {property.bathrooms} bath · Up to {property.maxGuests} guests</span>
        </div>

        <div className="mt-auto flex flex-wrap items-center justify-between gap-x-2 gap-y-1 pt-2">
          <ReviewScoreBadge rating={property.rating} reviewCount={property.reviewCount} compact />
          <span className="font-heading text-base font-semibold text-foreground">
            {formatGHS(property.pricePerNight)}
            <span className="text-xs font-normal text-muted-foreground"> /night</span>
          </span>
        </div>
      </div>
    </Link>
  );
}
