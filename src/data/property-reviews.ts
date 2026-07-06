import type { PropertyReview } from "@/lib/stay-types";

export const propertyReviews: PropertyReview[] = [
  {
    id: "prev-1",
    propertyId: "prop-osu-garden",
    userName: "Abigail M.",
    userAvatar: "https://i.pravatar.cc/100?img=25",
    rating: 5,
    categoryRatings: { cleanliness: 5, accuracy: 5, communication: 5, location: 5, value: 4.8 },
    text: "The garden courtyard made this feel so much more private than a typical apartment. Ama replied to every message within minutes.",
    date: "2026-05-12",
  },
  {
    id: "prev-2",
    propertyId: "prop-osu-garden",
    userName: "Kofi T.",
    userAvatar: "https://i.pravatar.cc/100?img=8",
    rating: 5,
    categoryRatings: { cleanliness: 4.9, accuracy: 4.8, communication: 5, location: 4.8, value: 4.9 },
    text: "Spotless, exactly as photographed, and an easy walk to everything in Osu.",
    date: "2026-04-02",
  },
  {
    id: "prev-3",
    propertyId: "prop-riverside-hotel",
    userName: "Linda O.",
    userAvatar: "https://i.pravatar.cc/100?img=20",
    rating: 5,
    categoryRatings: { cleanliness: 5, accuracy: 4.9, communication: 4.7, location: 5, value: 4.6 },
    text: "Loved the rooftop breakfast and the room was quiet despite being in the city centre.",
    date: "2026-05-28",
  },
  {
    id: "prev-4",
    propertyId: "prop-east-legon-villa",
    userName: "Michael B.",
    userAvatar: "https://i.pravatar.cc/100?img=33",
    rating: 5,
    categoryRatings: { cleanliness: 5, accuracy: 4.8, communication: 5, location: 4.9, value: 4.7 },
    text: "Hosted our whole extended family here for a reunion. The pool and space were perfect, and Kojo checked in on us daily without being intrusive.",
    date: "2026-03-15",
  },
  {
    id: "prev-5",
    propertyId: "prop-jamestown-loft",
    userName: "Priscilla A.",
    userAvatar: "https://i.pravatar.cc/100?img=36",
    rating: 5,
    categoryRatings: { cleanliness: 4.8, accuracy: 5, communication: 5, location: 5, value: 4.7 },
    text: "Waking up to that sea view over the lighthouse was worth it alone. Such a unique stay.",
    date: "2026-02-20",
  },
];

export function getPropertyReviews(propertyId: string) {
  return propertyReviews.filter((r) => r.propertyId === propertyId);
}
