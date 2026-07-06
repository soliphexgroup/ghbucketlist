"use client";

import { PropertyDetailContent } from "@/components/stay/property-detail-content";
import { useHostCreatedProperties } from "@/lib/host-properties-store";
import { getPropertyHost } from "@/lib/stay-repository";
import { getPropertyReviews } from "@/data/property-reviews";
import type { Property, PropertyReview } from "@/lib/stay-types";
import type { Host } from "@/lib/types";

export function PropertyDetailWithOverride({
  property,
  host,
  reviews,
}: {
  property: Property;
  host: Host | undefined;
  reviews: PropertyReview[];
}) {
  const created = useHostCreatedProperties();
  const override = created.find((p) => p.id === property.id);

  if (!override) {
    return <PropertyDetailContent property={property} host={host} reviews={reviews} />;
  }

  return (
    <PropertyDetailContent
      property={override}
      host={getPropertyHost(override)}
      reviews={getPropertyReviews(override.id)}
    />
  );
}
