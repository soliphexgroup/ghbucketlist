import { properties } from "@/data/properties";
import { hosts } from "@/data/hosts";
import type { Property, PropertyType } from "@/lib/stay-types";

export type StayFilters = {
  q?: string;
  guests?: number;
  propertyTypes?: PropertyType[];
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  amenities?: string[];
  instantBookOnly?: boolean;
  minRating?: number;
  sort?: "recommended" | "price-asc" | "price-desc" | "rating";
};

export function listProperties(filters: StayFilters = {}, extra: Property[] = []): Property[] {
  const overrideIds = new Set(extra.map((p) => p.id));
  const base = properties.filter((p) => !overrideIds.has(p.id));
  let results = [...extra, ...base];

  if (filters.q) {
    const q = filters.q.toLowerCase();
    results = results.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.neighbourhood.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
    );
  }

  if (filters.guests) {
    results = results.filter((p) => p.maxGuests >= filters.guests!);
  }

  if (filters.propertyTypes && filters.propertyTypes.length > 0) {
    results = results.filter((p) => filters.propertyTypes!.includes(p.propertyType));
  }

  if (filters.minPrice !== undefined) {
    results = results.filter((p) => p.pricePerNight >= filters.minPrice!);
  }
  if (filters.maxPrice !== undefined) {
    results = results.filter((p) => p.pricePerNight <= filters.maxPrice!);
  }

  if (filters.bedrooms) {
    results = results.filter((p) => p.bedrooms >= filters.bedrooms!);
  }

  if (filters.amenities && filters.amenities.length > 0) {
    results = results.filter((p) => filters.amenities!.every((a) => p.amenities.includes(a)));
  }

  if (filters.instantBookOnly) {
    results = results.filter((p) => p.bookingType === "instant");
  }

  if (filters.minRating) {
    results = results.filter((p) => p.rating >= filters.minRating!);
  }

  const sort = filters.sort ?? "recommended";
  results.sort((a, b) => {
    if (sort === "price-asc") return a.pricePerNight - b.pricePerNight;
    if (sort === "price-desc") return b.pricePerNight - a.pricePerNight;
    if (sort === "rating") return b.rating - a.rating;
    return b.rating * Math.log(b.reviewCount + 1) - a.rating * Math.log(a.reviewCount + 1);
  });

  return results;
}

export function getPropertyHost(property: Property) {
  return hosts.find((h) => h.id === property.hostId);
}

export function listPropertyNeighbourhoods() {
  return Array.from(new Set(properties.map((p) => p.neighbourhood))).sort();
}

export function propertyPriceBounds() {
  const prices = properties.map((p) => p.pricePerNight);
  return { min: 0, max: Math.max(...prices, 500) };
}
