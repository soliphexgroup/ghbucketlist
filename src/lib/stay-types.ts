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
  /** Drives the "Only N left" urgency note. */
  roomsLeft: number;
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
