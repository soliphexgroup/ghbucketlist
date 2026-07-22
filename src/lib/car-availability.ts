import { rangesOverlap, type DateRange } from "@/lib/availability";
import type { Car } from "@/lib/car-types";
import type { StoredCarBooking } from "@/lib/car-bookings-store";

// Availability seam for car rentals — the whole-unit shape (each car is one vehicle).
// Seeded fiction on the car (unavailableRanges) stands in for "already rented by others";
// the viewer's own bookings from the store are layered on so a rental consumes the car.

/** Bookings that still hold the car. Cancelled/declined ones free the dates back up. */
const HOLDS_DATES: StoredCarBooking["status"][] = ["confirmed", "pending_request", "completed"];

function activeBookingsFor(carId: string, bookings: StoredCarBooking[]) {
  return bookings.filter((b) => b.carId === carId && HOLDS_DATES.includes(b.status));
}

/** Is the car free for the whole pickup→return range? */
export function isCarAvailable(
  car: Car,
  pickupISO: string,
  returnISO: string,
  bookings: StoredCarBooking[] = []
) {
  const seededClash = (car.unavailableRanges ?? []).some((r) =>
    rangesOverlap(pickupISO, returnISO, r.start, r.end)
  );
  if (seededClash) return false;
  return !activeBookingsFor(car.id, bookings).some((b) =>
    rangesOverlap(pickupISO, returnISO, b.pickupDateISO.slice(0, 10), b.returnDateISO.slice(0, 10))
  );
}

/** Every range that blocks the car — seeded plus the viewer's own bookings. */
export function carBlockedRanges(car: Car, bookings: StoredCarBooking[] = []): DateRange[] {
  return [
    ...(car.unavailableRanges ?? []),
    ...activeBookingsFor(car.id, bookings).map((b) => ({
      start: b.pickupDateISO.slice(0, 10),
      end: b.returnDateISO.slice(0, 10),
    })),
  ];
}
