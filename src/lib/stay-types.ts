export type PropertyType = "hotel" | "apartment" | "vacation";
export type CancellationPolicy = "flexible" | "moderate" | "strict";
export type StayBookingType = "instant" | "request";

/** A bed layout within a unit ("Main bedroom: 1 Queen"). Descriptive, not bookable. */
export type PropertyRoom = {
  id: string;
  roomName: string;
  bedType: string;
  bedCount: number;
};

export type RoomPerk = "breakfast" | "free_cancellation" | "pay_at_property";

/** An ISO `YYYY-MM-DD` date range, checkout-exclusive (the `end` night isn't occupied). */
export type DateRange = { start: string; end: string };

/**
 * A bookable room type, as sold by hotels. Distinct from PropertyRoom: an apartment's
 * bedrooms aren't sold separately, so only hotels carry these.
 */
export type RoomOffer = {
  id: string;
  name: string;
  /** e.g. "1 large double bed" */
  bedSummary: string;
  maxGuests: number;
  pricePerNight: number;
  perks: RoomPerk[];
  /** Total physical rooms of this type. How many remain depends on the dates searched. */
  inventory: number;
  /**
   * Seeded fiction (not live data): each entry is one room of this type already booked
   * for that range. Rooms left for a search = inventory − overlapping entries − the
   * viewer's own overlapping bookings.
   */
  bookedRanges?: DateRange[];
};

export type CategoryRatings = {
  cleanliness: number;
  accuracy: number;
  communication: number;
  location: number;
  value: number;
};

export type Property = {
  id: string;
  slug: string;
  title: string;
  description: string;
  propertyType: PropertyType;
  hostId: string;
  images: string[];
  neighbourhood: string;
  city: string;
  address: string;
  bedrooms: number;
  bathrooms: number;
  maxGuests: number;
  sizeSqm?: number;
  amenities: string[];
  /** Sleeping arrangements (bed layout) — every property has these. */
  rooms: PropertyRoom[];
  /** Bookable room types — hotels only. Absent means the whole unit is booked at once. */
  roomTypes?: RoomOffer[];
  /**
   * Whole-unit stays only (no roomTypes): seeded date ranges the unit is already booked.
   * Fiction, not live data — combined with the viewer's own bookings to decide availability.
   */
  unavailableRanges?: DateRange[];
  /** The "from" price: for hotels this matches the cheapest room type. */
  pricePerNight: number;
  weekendPrice?: number;
  cleaningFee: number;
  minNights: number;
  maxNights?: number;
  checkInTime: string;
  checkOutTime: string;
  bookingType: StayBookingType;
  cancellationPolicy: CancellationPolicy;
  noSmoking: boolean;
  noParties: boolean;
  petsAllowed: boolean;
  customRules?: string;
  rating: number;
  reviewCount: number;
  categoryRatings: CategoryRatings;
  createdAt: string;
};

export type PropertyReview = {
  id: string;
  propertyId: string;
  userName: string;
  userAvatar: string;
  rating: number;
  categoryRatings: CategoryRatings;
  text: string;
  date: string;
};
