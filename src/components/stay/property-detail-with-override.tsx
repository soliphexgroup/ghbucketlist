"use client";

import { PropertyDetailContent } from "@/components/stay/property-detail-content";
import { useHostCreatedProperties } from "@/lib/host-properties-store";
import { getPropertyHost } from "@/lib/stay-repository";
import type { Property } from "@/lib/stay-types";
import type { Host } from "@/lib/types";

export function PropertyDetailWithOverride({
  property,
  host,
}: {
  property: Property;
  host: Host | undefined;
}) {
  const created = useHostCreatedProperties();
  const override = created.find((p) => p.id === property.id);

  if (!override) {
    return <PropertyDetailContent property={property} host={host} />;
  }

  return <PropertyDetailContent property={override} host={getPropertyHost(override)} />;
}
