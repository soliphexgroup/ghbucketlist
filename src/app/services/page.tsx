import { Suspense } from "react";
import type { Metadata } from "next";
import { VerticalHero } from "@/components/vertical-hero";
import { MobileHero } from "@/components/home/mobile-hero";
import { MobileSearchBar } from "@/components/home/mobile-search-bar";
import { ServicesLanding } from "@/components/services/services-landing";

export const metadata: Metadata = {
  title: "Handyman Services",
  description: "Trusted local carpenters, electricians, plumbers, cleaners, and welders across Accra.",
};

export default function ServicesPage() {
  return (
    <>
      <Suspense fallback={null}>
        <MobileHero
          activeTab="handyman"
          headline="Find trusted help, fast"
          subheading="Carpenters, electricians, plumbers, cleaners, and welders — verified local pros across Accra."
        />
      </Suspense>
      <Suspense fallback={null}>
        <MobileSearchBar activeTab="handyman" />
      </Suspense>
      <div className="hidden lg:block">
        <VerticalHero
          activeTab="handyman"
          headline="Find trusted help, fast"
          subheading="Carpenters, electricians, plumbers, cleaners, and welders — verified local pros across Accra."
        />
      </div>
      <Suspense fallback={null}>
        <ServicesLanding />
      </Suspense>
    </>
  );
}
