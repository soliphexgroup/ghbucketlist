import { Suspense } from "react";
import type { Metadata } from "next";
import { VerticalHero } from "@/components/vertical-hero";
import { MobileHero } from "@/components/home/mobile-hero";
import { MobileSearchBar } from "@/components/home/mobile-search-bar";
import { CarsLanding } from "@/components/cars/cars-landing";

export const metadata: Metadata = {
  title: "Car Rental",
  description: "Self-drive and chauffeur car rentals across Accra.",
};

export default function CarsPage() {
  return (
    <>
      <Suspense fallback={null}>
        <MobileHero
          activeTab="car-rentals"
          headline="Find your perfect rental car"
          subheading="Self-drive or with a driver — compare rates on cars across Accra and beyond."
        />
      </Suspense>
      <Suspense fallback={null}>
        <MobileSearchBar activeTab="car-rentals" />
      </Suspense>
      <div className="hidden lg:block">
        <VerticalHero
          activeTab="car-rentals"
          headline="Find your perfect rental car"
          subheading="Self-drive or with a driver — compare rates on cars across Accra and beyond."
        />
      </div>
      <Suspense fallback={null}>
        <CarsLanding />
      </Suspense>
    </>
  );
}
