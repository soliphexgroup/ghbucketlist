import type { TripTier } from "@/lib/trip-inquiries-store";

export type TripTierInfo = {
  id: TripTier;
  name: string;
  price: number;
  popular?: boolean;
  inclusions: string[];
};

export const defaultTripTiers: TripTierInfo[] = [
  {
    id: "essentials",
    name: "Essentials Itinerary",
    price: 600,
    inclusions: [
      "30-minute consultation call",
      "Custom day-by-day itinerary",
      "Vetted local contacts",
      "Budget breakdown",
    ],
  },
  {
    id: "standard",
    name: "Standard Curation",
    price: 950,
    popular: true,
    inclusions: [
      "Everything in Essentials",
      "Booking coordination",
      "Vendor contact handoff",
      "1 revision round",
      "WhatsApp check-in during travel",
    ],
  },
  {
    id: "premium",
    name: "Premium Experience",
    price: 1350,
    inclusions: [
      "Everything in Standard",
      "Airport pickup",
      "Real-time WhatsApp support",
      "Restaurant & tour bookings",
      "Welcome pack",
      "On-ground support",
      "2 revision rounds",
    ],
  },
];
