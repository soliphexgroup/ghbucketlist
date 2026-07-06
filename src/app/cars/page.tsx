import type { Metadata } from "next";
import { CarBrowser } from "@/components/cars/car-browser";

export const metadata: Metadata = {
  title: "Car Rental",
  description: "Self-drive and chauffeur car rentals across Accra.",
};

export default function CarsPage() {
  return <CarBrowser />;
}
