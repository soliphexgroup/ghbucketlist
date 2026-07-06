import type { Category } from "@/lib/types";

export const categories: Category[] = [
  {
    id: "cat-outdoor",
    name: "Outdoor Adventures",
    slug: "outdoor",
    icon: "Compass",
    colorHex: "#16A34A",
    description: "Hikes, road trips, and open-air escapes",
  },
  {
    id: "cat-food",
    name: "Food & Drink",
    slug: "food-drink",
    icon: "UtensilsCrossed",
    colorHex: "#EA580C",
    description: "Tastings, supper clubs, and culinary tours",
  },
  {
    id: "cat-arts",
    name: "Arts & Culture",
    slug: "arts-culture",
    icon: "Palette",
    colorHex: "#7C3AED",
    description: "Galleries, craft sessions, and creative meetups",
  },
  {
    id: "cat-sports",
    name: "Sports & Fitness",
    slug: "sports-fitness",
    icon: "Dumbbell",
    colorHex: "#2563EB",
    description: "Pickup games, classes, and active hangouts",
  },
  {
    id: "cat-nightlife",
    name: "Nightlife",
    slug: "nightlife",
    icon: "Moon",
    colorHex: "#1E3A5F",
    description: "Late nights, live sets, and social lounges",
  },
  {
    id: "cat-music",
    name: "Music & Concerts",
    slug: "music",
    icon: "Music",
    colorHex: "#DB2777",
    description: "Live shows, jam sessions, and listening rooms",
  },
  {
    id: "cat-tours",
    name: "Tours & Sightseeing",
    slug: "tours",
    icon: "MapPinned",
    colorHex: "#0EA5E9",
    description: "Guided walks and city discovery",
  },
  {
    id: "cat-photography",
    name: "Photography",
    slug: "photography",
    icon: "Camera",
    colorHex: "#475569",
    description: "Walks, workshops, and shoot-alongs",
  },
  {
    id: "cat-cycling",
    name: "Cycling",
    slug: "cycling",
    icon: "Bike",
    colorHex: "#65A30D",
    description: "Group rides for every pace",
  },
  {
    id: "cat-gaming",
    name: "Gaming",
    slug: "gaming",
    icon: "Gamepad2",
    colorHex: "#4338CA",
    description: "Tournaments, board games, and arcades",
  },
  {
    id: "cat-history",
    name: "History & Heritage",
    slug: "history",
    icon: "Landmark",
    colorHex: "#92400E",
    description: "Museums, heritage trails, and storytelling",
  },
  {
    id: "cat-parties",
    name: "Parties & Events",
    slug: "parties",
    icon: "PartyPopper",
    colorHex: "#E11D48",
    description: "Celebrations, mixers, and pop-ups",
  },
  {
    id: "cat-workshops",
    name: "Workshops",
    slug: "workshops",
    icon: "GraduationCap",
    colorHex: "#8B5CF6",
    description: "Hands-on classes to learn something new",
  },
];

export function getCategoryBySlug(slug: string) {
  return categories.find((c) => c.slug === slug);
}

export function getCategoryById(id: string) {
  return categories.find((c) => c.id === id);
}
