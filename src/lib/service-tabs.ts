import { BedDouble, Compass, Car, Wrench, Gift, type LucideIcon } from "lucide-react";

export type ServiceTabId = "stays" | "things-to-do" | "car-rentals" | "handyman" | "rewards";

export type ServiceTab = {
  id: ServiceTabId;
  label: string;
  icon: LucideIcon;
  href: string;
};

export const serviceTabs: ServiceTab[] = [
  { id: "things-to-do", label: "Things to Do", icon: Compass, href: "/" },
  { id: "stays", label: "Stays", icon: BedDouble, href: "/stay" },
  { id: "car-rentals", label: "Car Rentals", icon: Car, href: "/cars" },
  { id: "handyman", label: "Handyman Services", icon: Wrench, href: "/services" },
  { id: "rewards", label: "Bucket Rewards", icon: Gift, href: "/rewards" },
];

export function getActiveServiceTab(pathname: string): ServiceTabId | null {
  if (pathname === "/" || pathname.startsWith("/activities")) return "things-to-do";
  if (pathname.startsWith("/stay")) return "stays";
  if (pathname.startsWith("/cars")) return "car-rentals";
  if (pathname.startsWith("/services")) return "handyman";
  if (pathname.startsWith("/rewards")) return "rewards";
  return null;
}

/** Pages that render their own VerticalHero (with its own tabs bar) — the header must not duplicate it. */
export const PAGES_WITH_OWN_HERO = ["/", "/stay", "/cars", "/activities", "/services"];
