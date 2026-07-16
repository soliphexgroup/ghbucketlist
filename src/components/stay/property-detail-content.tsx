import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { Bath, BedDouble, ChevronRight, MapPin, Users } from "lucide-react";
import { Container } from "@/components/container";
import { Separator } from "@/components/ui/separator";
import { StarRating } from "@/components/star-rating";
import { Gallery } from "@/components/activities/detail/gallery";
import { VenueMap } from "@/components/activities/detail/venue-map";
import { AmenitiesGrid } from "@/components/stay/amenities-grid";
import { PropertyReviewsSection } from "@/components/stay/property-reviews-section";
import { StayBookingWidget } from "@/components/stay/stay-booking-widget";
import { RoomOfferTable } from "@/components/stay/room-offer-table";
import { cn } from "@/lib/utils";
import type { Property } from "@/lib/stay-types";
import type { PropertyReview } from "@/lib/stay-types";
import type { Host } from "@/lib/types";

const propertyTypeLabels = { hotel: "Hotel", apartment: "Apartment", vacation: "Vacation Home" };
const cancellationCopy = {
  flexible: "Full refund up to 24 hours before check-in.",
  moderate: "Full refund up to 5 days before check-in.",
  strict: "50% refund up to 7 days before check-in; no refund after.",
};

export function PropertyDetailContent({
  property,
  host,
  reviews,
}: {
  property: Property;
  host: Host | undefined;
  reviews: PropertyReview[];
}) {
  const mapQuery = `${property.neighbourhood}, ${property.city}`;
  // Hotels sell individual room types, so they get the availability table instead of
  // the whole-unit booking card.
  const hasRoomTable = Boolean(property.roomTypes?.length);

  return (
    <Container className="py-6 sm:py-8">
      <nav className="mb-5 flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-primary">Home</Link>
        <ChevronRight className="size-3.5" />
        <Link href="/stay" className="hover:text-primary">Places to Stay</Link>
        <ChevronRight className="size-3.5" />
        <span className="truncate text-foreground">{property.title}</span>
      </nav>

      <Gallery images={property.images} title={property.title} />

      <div className="mt-8 flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold text-secondary-foreground">
            {propertyTypeLabels[property.propertyType]}
          </span>
          <StarRating rating={property.rating} reviewCount={property.reviewCount} />
        </div>
        <h1 className="font-heading text-3xl font-bold text-foreground sm:text-4xl">{property.title}</h1>
        <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin className="size-4" />
          {property.neighbourhood}, {property.city}
        </p>
      </div>

      {hasRoomTable && (
        <section id="availability" className="mt-8">
          <h2 className="font-heading text-xl font-semibold text-foreground">Availability</h2>
          <div className="mt-4">
            <Suspense fallback={null}>
              <RoomOfferTable property={property} />
            </Suspense>
          </div>
        </section>
      )}

      <div className={cn("mt-8 grid grid-cols-1 gap-10", !hasRoomTable && "lg:grid-cols-[1fr_380px]")}>
        <div className="flex flex-col gap-10">
          {host && (
            <div className="flex items-center gap-3">
              <Image src={host.avatarUrl} alt={host.name} width={48} height={48} className="size-12 rounded-full object-cover" />
              <div>
                <p className="text-sm text-muted-foreground">Hosted by</p>
                <p className="font-heading text-base font-semibold text-foreground">{host.name}</p>
              </div>
              <span className="ml-auto text-sm text-muted-foreground">Joined {host.joinedYear}</span>
            </div>
          )}

          <div className="flex flex-wrap gap-4">
            <span className="flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-sm text-foreground">
              <BedDouble className="size-4" />
              {property.bedrooms} bedroom{property.bedrooms > 1 ? "s" : ""}
            </span>
            <span className="flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-sm text-foreground">
              <Bath className="size-4" />
              {property.bathrooms} bathroom{property.bathrooms > 1 ? "s" : ""}
            </span>
            <span className="flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-sm text-foreground">
              <Users className="size-4" />
              Up to {property.maxGuests} guests
            </span>
          </div>

          <Separator />

          <section>
            <h2 className="font-heading text-xl font-semibold text-foreground">About this place</h2>
            <p className="mt-3 leading-relaxed text-muted-foreground">{property.description}</p>
          </section>

          <Separator />

          <section>
            <h2 className="font-heading text-xl font-semibold text-foreground">What this place offers</h2>
            <div className="mt-4">
              <AmenitiesGrid amenities={property.amenities} />
            </div>
          </section>

          <Separator />

          <section>
            <h2 className="font-heading text-xl font-semibold text-foreground">Sleeping arrangements</h2>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {property.rooms.map((room) => (
                <div key={room.id} className="rounded-xl border border-border p-4">
                  <p className="font-medium text-foreground">{room.roomName}</p>
                  <p className="text-sm text-muted-foreground">
                    {room.bedCount} {room.bedType} bed{room.bedCount > 1 ? "s" : ""}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <Separator />

          <section>
            <h2 className="font-heading text-xl font-semibold text-foreground">House rules</h2>
            <div className="mt-3 grid grid-cols-2 gap-3 text-sm text-muted-foreground sm:grid-cols-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Check-in</p>
                <p className="text-foreground">{property.checkInTime}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Check-out</p>
                <p className="text-foreground">{property.checkOutTime}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Smoking</p>
                <p className="text-foreground">{property.noSmoking ? "Not allowed" : "Allowed"}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Pets</p>
                <p className="text-foreground">{property.petsAllowed ? "Allowed" : "Not allowed"}</p>
              </div>
            </div>
            {property.customRules && <p className="mt-3 text-sm text-muted-foreground">{property.customRules}</p>}
          </section>

          <Separator />

          <section>
            <h2 className="font-heading text-xl font-semibold text-foreground">Cancellation policy</h2>
            <p className="mt-2 text-sm font-medium capitalize text-foreground">{property.cancellationPolicy}</p>
            <p className="mt-1 text-sm text-muted-foreground">{cancellationCopy[property.cancellationPolicy]}</p>
          </section>

          <Separator />

          <section>
            <h2 className="font-heading text-xl font-semibold text-foreground">Location</h2>
            <p className="mt-2 text-muted-foreground">
              Located in {property.neighbourhood}, {property.city}. Exact address shared after booking.
            </p>
            <div className="mt-4">
              <VenueMap query={mapQuery} />
            </div>
          </section>

          <Separator />

          <PropertyReviewsSection
            rating={property.rating}
            reviewCount={property.reviewCount}
            categoryRatings={property.categoryRatings}
            reviews={reviews}
          />
        </div>

        {!hasRoomTable && (
          <div>
            <Suspense fallback={null}>
              <StayBookingWidget property={property} />
            </Suspense>
          </div>
        )}
      </div>
    </Container>
  );
}
