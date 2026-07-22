import { rangesOverlap, toISODate, isNightBlocked, type DateRange } from "@/lib/availability";
import type { Property, RoomOffer } from "@/lib/stay-types";
import type { StoredStayBooking } from "@/lib/stay-bookings-store";

// Availability seam for stays. Two inputs feed it: seeded fiction on the listings
// (unavailableRanges / bookedRanges) standing in for "already booked by others", and the
// viewer's own bookings from the store (real, but per-browser). Everything reads through
// here so a real backend can later replace the internals without touching the UI.
// Generic range maths lives in lib/availability; these re-exports keep existing imports working.
export { rangesOverlap, toISODate, isNightBlocked };

/** Bookings that still hold a room. Cancelled/declined ones free their dates back up. */
const HOLDS_DATES: StoredStayBooking["status"][] = ["confirmed", "pending_request", "completed"];

function activeBookingsFor(propertyId: string, bookings: StoredStayBooking[]) {
  return bookings.filter((b) => b.propertyId === propertyId && HOLDS_DATES.includes(b.status));
}

/** The viewer's own bookings of this property that overlap the requested stay. */
function overlappingOwnBookings(
  property: Property,
  checkInISO: string,
  checkOutISO: string,
  bookings: StoredStayBooking[]
) {
  return activeBookingsFor(property.id, bookings).filter((b) =>
    rangesOverlap(checkInISO, checkOutISO, b.checkInISO.slice(0, 10), b.checkOutISO.slice(0, 10))
  );
}

/** Rooms of one hotel room type still bookable for the range, floored at 0. */
export function roomsLeftForRange(
  property: Property,
  offer: RoomOffer,
  checkInISO: string,
  checkOutISO: string,
  bookings: StoredStayBooking[] = []
) {
  const seededBooked = (offer.bookedRanges ?? []).filter((r) =>
    rangesOverlap(checkInISO, checkOutISO, r.start, r.end)
  ).length;

  const ownBooked = overlappingOwnBookings(property, checkInISO, checkOutISO, bookings).reduce(
    (sum, b) =>
      sum + (b.roomSelections ?? []).filter((s) => s.name === offer.name).reduce((n, s) => n + s.qty, 0),
    0
  );

  return Math.max(0, offer.inventory - seededBooked - ownBooked);
}

/** A whole-unit stay (no room types) is free for the range. */
export function isUnitAvailable(
  property: Property,
  checkInISO: string,
  checkOutISO: string,
  bookings: StoredStayBooking[] = []
) {
  const seededClash = (property.unavailableRanges ?? []).some((r) =>
    rangesOverlap(checkInISO, checkOutISO, r.start, r.end)
  );
  if (seededClash) return false;
  return overlappingOwnBookings(property, checkInISO, checkOutISO, bookings).length === 0;
}

/** Does the property have anything bookable for the range? Used by the listing filter. */
export function hasAvailability(
  property: Property,
  checkInISO: string,
  checkOutISO: string,
  bookings: StoredStayBooking[] = []
) {
  if (property.roomTypes && property.roomTypes.length > 0) {
    return property.roomTypes.some(
      (offer) => roomsLeftForRange(property, offer, checkInISO, checkOutISO, bookings) > 0
    );
  }
  return isUnitAvailable(property, checkInISO, checkOutISO, bookings);
}

/** Every range that blocks a whole-unit property — seeded plus the viewer's own bookings. */
export function unitBlockedRanges(property: Property, bookings: StoredStayBooking[] = []): DateRange[] {
  return [
    ...(property.unavailableRanges ?? []),
    ...activeBookingsFor(property.id, bookings).map((b) => ({
      start: b.checkInISO.slice(0, 10),
      end: b.checkOutISO.slice(0, 10),
    })),
  ];
}
