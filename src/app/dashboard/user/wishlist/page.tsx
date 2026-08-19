"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ActivityCard } from "@/components/activity-card";
import { PropertyCard } from "@/components/stay/property-card";
import { CarCard } from "@/components/cars/car-card";
import { ProviderCard } from "@/components/services/provider-card";
import { useWishlistIds } from "@/lib/wishlist-store";
import {
  useDbStayListings,
  useDbCarListings,
  useDbExperienceListings,
  useDbServiceListings,
} from "@/lib/db-listings";

export default function MyWishlistPage() {
  const ids = useWishlistIds();
  // Resolve saved ids against the live DB catalogs so host-created listings show too (the static
  // seed lookups only knew the demo catalog). Mapping over ids preserves the save order.
  const dbExperiences = useDbExperienceListings();
  const dbStays = useDbStayListings();
  const dbCars = useDbCarListings();
  const dbServices = useDbServiceListings();
  const experiences = ids.map((id) => dbExperiences.find((e) => e.id === id)).filter((e) => e !== undefined);
  const stays = ids.map((id) => dbStays.find((p) => p.id === id)).filter((p) => p !== undefined);
  const rentalCars = ids.map((id) => dbCars.find((c) => c.id === id)).filter((c) => c !== undefined);
  const providers = ids.map((id) => dbServices.find((p) => p.id === id)).filter((p) => p !== undefined);
  const isEmpty = experiences.length === 0 && stays.length === 0 && rentalCars.length === 0 && providers.length === 0;

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-foreground">My Wishlist</h1>
      <p className="mt-1 text-muted-foreground">Experiences, stays, cars, and service providers you&apos;ve saved for later.</p>

      {isEmpty ? (
        <div className="mt-6 rounded-2xl border border-dashed border-border p-10 text-center">
          <p className="text-sm text-muted-foreground">
            You haven&apos;t saved anything yet. Tap the heart icon on any activity or stay to add
            it here.
          </p>
          <Button asChild className="mt-4">
            <Link href="/">Browse Activities</Link>
          </Button>
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-10">
          {experiences.length > 0 && (
            <div>
              <h2 className="font-heading text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Activities
              </h2>
              <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {experiences.map((experience) => (
                  <ActivityCard key={experience.id} experience={experience} />
                ))}
              </div>
            </div>
          )}

          {stays.length > 0 && (
            <div>
              <h2 className="font-heading text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Places to Stay
              </h2>
              <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {stays.map((property) => (
                  <PropertyCard key={property.id} property={property} />
                ))}
              </div>
            </div>
          )}

          {rentalCars.length > 0 && (
            <div>
              <h2 className="font-heading text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Car Rentals
              </h2>
              <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {rentalCars.map((car) => (
                  <CarCard key={car.id} car={car} />
                ))}
              </div>
            </div>
          )}

          {providers.length > 0 && (
            <div>
              <h2 className="font-heading text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Handyman Services
              </h2>
              <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {providers.map((provider) => (
                  <ProviderCard key={provider.id} provider={provider} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
