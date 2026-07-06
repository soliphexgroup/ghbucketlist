export type PropertyType = "hotel" | "apartment" | "vacation";
export type CancellationPolicy = "flexible" | "moderate" | "strict";
export type StayBookingType = "instant" | "request";

export type PropertyRoom = {
  id: string;
  roomName: string;
  bedType: string;
  bedCount: number;
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
  rooms: PropertyRoom[];
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
