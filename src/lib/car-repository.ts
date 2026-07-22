import { cars } from "@/data/cars";
import { hosts } from "@/data/hosts";
import { isCarAvailable } from "@/lib/car-availability";
import type { StoredCarBooking } from "@/lib/car-bookings-store";
import type { Car, CarCategory } from "@/lib/car-types";

export type CarFilters = {
  q?: string;
  categories?: CarCategory[];
  minPrice?: number;
  maxPrice?: number;
  seats?: number;
  transmission?: Car["transmission"];
  features?: string[];
  driverAvailableOnly?: boolean;
  instantBookOnly?: boolean;
  minRating?: number;
  /**
   * Length of the requested rental, from the pickup and return dates. Cars that won't
   * do a rental that short or that long drop out. This is not availability — nothing
   * records which cars are already booked — only whether the term is one they accept.
   */
  rentalDays?: number;
  /** ISO `YYYY-MM-DD`. When both are set, only cars free for the range are kept. */
  pickup?: string;
  returnDate?: string;
  sort?: "recommended" | "price-asc" | "price-desc" | "rating";
};

export function listCars(
  filters: CarFilters = {},
  /** The viewer's own car bookings, so a just-rented car drops out of results too. */
  bookings: StoredCarBooking[] = []
): Car[] {
  let results = [...cars];

  if (filters.q) {
    const q = filters.q.toLowerCase();
    results = results.filter(
      (c) =>
        c.make.toLowerCase().includes(q) ||
        c.model.toLowerCase().includes(q) ||
        c.pickupLocation.toLowerCase().includes(q)
    );
  }

  if (filters.categories && filters.categories.length > 0) {
    results = results.filter((c) => filters.categories!.includes(c.category));
  }

  if (filters.minPrice !== undefined) {
    results = results.filter((c) => c.pricePerDay >= filters.minPrice!);
  }
  if (filters.maxPrice !== undefined) {
    results = results.filter((c) => c.pricePerDay <= filters.maxPrice!);
  }

  if (filters.seats) {
    results = results.filter((c) => c.seats >= filters.seats!);
  }

  if (filters.transmission) {
    results = results.filter((c) => c.transmission === filters.transmission);
  }

  if (filters.features && filters.features.length > 0) {
    results = results.filter((c) => filters.features!.every((f) => c.features.includes(f)));
  }

  if (filters.driverAvailableOnly) {
    results = results.filter((c) => c.driverAvailable);
  }

  if (filters.instantBookOnly) {
    results = results.filter((c) => c.bookingType === "instant");
  }

  if (filters.minRating) {
    results = results.filter((c) => c.rating >= filters.minRating!);
  }

  if (filters.rentalDays && filters.rentalDays > 0) {
    results = results.filter(
      (c) =>
        c.minRentalDays <= filters.rentalDays! &&
        (c.maxRentalDays === undefined || c.maxRentalDays >= filters.rentalDays!)
    );
  }

  if (filters.pickup && filters.returnDate) {
    results = results.filter((c) => isCarAvailable(c, filters.pickup!, filters.returnDate!, bookings));
  }

  const sort = filters.sort ?? "recommended";
  results.sort((a, b) => {
    if (sort === "price-asc") return a.pricePerDay - b.pricePerDay;
    if (sort === "price-desc") return b.pricePerDay - a.pricePerDay;
    if (sort === "rating") return b.rating - a.rating;
    return b.rating * Math.log(b.reviewCount + 1) - a.rating * Math.log(a.reviewCount + 1);
  });

  return results;
}

export function getCarVendor(car: Car) {
  return hosts.find((h) => h.id === car.vendorId);
}

export function listCarCategories(): CarCategory[] {
  return Array.from(new Set(cars.map((c) => c.category)));
}

export function carPriceBounds() {
  const prices = cars.map((c) => c.pricePerDay);
  return { min: 0, max: Math.max(...prices, 500) };
}
