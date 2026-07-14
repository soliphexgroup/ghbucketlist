import type { Metadata } from "next";
import { ComingSoon } from "@/components/coming-soon";

export const metadata: Metadata = { title: "Restaurants Guide" };

export default function RestaurantsPage() {
  return (
    <ComingSoon
      title="Restaurants Guide"
      description="Our curated guide to the best places to eat across Ghana is coming soon."
    />
  );
}
