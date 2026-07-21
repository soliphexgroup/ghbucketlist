import type { Property, RoomOffer, DateRange } from "@/lib/stay-types";
import type { StoredStayBooking } from "@/lib/stay-bookings-store";

// Availability seam for stays. Two inputs feed it: seeded fiction on the listings
// (unavailableRanges / bookedRanges) standing in for "already booked by others", and the
// viewer's own bookings from the store (real, but per-browser). Everything reads through
// here so a real backend can later replace the internals without touching the UI.

/** Bookings that still hold a room. Cancelled/declined ones free their dates back up. */
const HOLDS_DATES: StoredStayBooking["status"][] = ["confirmed", "pending_request", "completed"];

/**
 * Two checkout-exclusive ranges overlap iff each starts before the other ends. ISO
 * `YYYY-MM-DD` strings compare correctly with `<`, so no Date parsing is needed.
 */
export function rangesOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string) {
  return aStart < bEnd && bStart < aEnd;
}

/** A single night (its ISO date) falls inside a checkout-exclusive range. */
function nightInRange(nightISO: string, range: DateRange) {
  return range.start <= nightISO && nightISO < range.end;
}

/** `Date` → local `YYYY-MM-DD` (not UTC, which can shift the day). */
export function toISODate(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

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

/** Whether a calendar day should be disabled for a whole-unit property. */
export function isNightBlocked(date: Date, ranges: DateRange[]) {
  const iso = toISODate(date);
  return ranges.some((range) => nightInRange(iso, range));
}
