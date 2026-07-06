import type { Metadata } from "next";
import { TripsPageContent } from "@/components/trips/trips-page-content";

export const metadata: Metadata = {
  title: "Curated Trips",
  description: "Personalized travel planning in Ghana across three service tiers.",
};

export default function TripsPage() {
  return <TripsPageContent />;
}
