import Image from "next/image";
import Link from "next/link";
import { Users, Zap } from "lucide-react";
import type { Car } from "@/lib/car-types";
import { StarRating } from "@/components/star-rating";
import { WishlistButton } from "@/components/wishlist-button";
import { formatGHS } from "@/lib/format";
import { cn } from "@/lib/utils";

const categoryLabels: Record<Car["category"], string> = {
  economy: "Economy",
  suv: "SUV",
  luxury: "Luxury",
  van: "Van",
};

export function CarCard({
  car,
  className,
  bookingQuery,
}: {
  car: Car;
  className?: string;
  /** Searched pickup/return to carry through, so the booking widget opens pre-filled. */
  bookingQuery?: string;
}) {
  return (
    <Link
      href={`/cars/${car.slug}${bookingQuery ? `?${bookingQuery}` : ""}`}
      className={cn(
        "group flex w-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-[0_2px_12px_rgba(0,0,0,0.08)] transition-shadow duration-200 hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)]",
        className
      )}
    >
      <div className="relative aspect-4/3 w-full overflow-hidden">
        <Image
          src={car.images[0]}
          alt={`${car.make} ${car.model}`}
          fill
          sizes="(min-width: 1024px) 320px, 45vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <span className="absolute top-3 left-3 inline-flex items-center rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-foreground shadow-sm">
          {categoryLabels[car.category]}
        </span>
        <WishlistButton experienceId={car.id} className="absolute top-3 right-3" />
        {car.bookingType === "instant" && (
          <span className="absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground shadow-sm">
            <Zap className="size-3 fill-current" />
            Instant Book
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-3 sm:gap-2 sm:p-4">
        <h3 className="line-clamp-1 font-heading text-sm font-semibold text-foreground sm:text-base">
          {car.make} {car.model} <span className="font-normal text-muted-foreground">{car.year}</span>
        </h3>
        <p className="truncate text-xs text-muted-foreground sm:text-sm">{car.pickupLocation}</p>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground sm:text-sm">
          <Users className="size-3.5 shrink-0" />
          <span className="truncate">{car.seats} seats · {car.transmission === "automatic" ? "Automatic" : "Manual"}</span>
        </div>

        <div className="mt-auto flex flex-wrap items-center justify-between gap-x-2 gap-y-1 pt-2">
          <StarRating rating={car.rating} reviewCount={car.reviewCount} />
          <span className="font-heading text-base font-semibold text-foreground">
            {formatGHS(car.pricePerDay)}
            <span className="text-xs font-normal text-muted-foreground"> /day</span>
          </span>
        </div>
      </div>
    </Link>
  );
}
