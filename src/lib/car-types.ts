import type { DateRange } from "@/lib/availability";

export type CarCategory = "economy" | "suv" | "luxury" | "van";
export type TransmissionType = "automatic" | "manual";
export type CarCancellationPolicy = "flexible" | "moderate" | "strict";

export type Car = {
  id: string;
  slug: string;
  make: string;
  model: string;
  year: number;
  category: CarCategory;
  vendorId: string;
  images: string[];
  city: string;
  pickupLocation: string;
  transmission: TransmissionType;
  seats: number;
  luggage: number;
  features: string[];
  pricePerDay: number;
  withDriverPricePerDay: number;
  driverAvailable: boolean;
  mileageLimitPerDay: number;
  minRentalDays: number;
  maxRentalDays?: number;
  /**
   * Seeded fiction (not live data): date ranges this exact vehicle is already rented,
   * end-exclusive. Combined with the viewer's own bookings to decide availability.
   */
  unavailableRanges?: DateRange[];
  cancellationPolicy: CarCancellationPolicy;
  bookingType: "instant" | "request";
  rating: number;
  reviewCount: number;
  createdAt: string;
};
