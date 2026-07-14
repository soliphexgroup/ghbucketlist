import { BedDouble, Compass, Car, Wrench, Utensils, type LucideIcon } from "lucide-react";

export type ServiceTabId = "stays" | "things-to-do" | "car-rentals" | "handyman" | "restaurants";

export type ServiceTab = {
  id: ServiceTabId;
  label: string;
  icon: LucideIcon;
  href: string;
};

export const serviceTabs: ServiceTab[] = [
  { id: "stays", label: "Stays", icon: BedDouble, href: "/" },
  { id: "things-to-do", label: "Things to Do", icon: Compass, href: "/activities" },
  { id: "car-rentals", label: "Car Rentals", icon: Car, href: "/cars" },
  { id: "handyman", label: "Handyman Services", icon: Wrench, href: "/services" },
  { id: "restaurants", label: "Restaurants Guide", icon: Utensils, href: "/restaurants" },
];

export function getActiveServiceTab(pathname: string): ServiceTabId | null {
  if (pathname === "/" || pathname.startsWith("/stay")) return "stays";
  if (pathname.startsWith("/activities")) return "things-to-do";
  if (pathname.startsWith("/cars")) return "car-rentals";
  if (pathname.startsWith("/services")) return "handyman";
  if (pathname.startsWith("/restaurants")) return "restaurants";
  return null;
}

/** Pages that render their own VerticalHero (with its own tabs bar) — the header must not duplicate it. */
export const PAGES_WITH_OWN_HERO = ["/", "/cars", "/activities", "/services"];
