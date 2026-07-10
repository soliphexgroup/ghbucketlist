import { Suspense } from "react";
import type { Metadata } from "next";
import { VerticalHero } from "@/components/vertical-hero";
import { ServicesLanding } from "@/components/services/services-landing";

export const metadata: Metadata = {
  title: "Handyman Services",
  description: "Trusted local carpenters, electricians, plumbers, cleaners, and welders across Accra.",
};

export default function ServicesPage() {
  return (
    <>
      <VerticalHero
        activeTab="handyman"
        headline="Find trusted help, fast"
        subheading="Carpenters, electricians, plumbers, cleaners, and welders — verified local pros across Accra."
      />
      <Suspense fallback={null}>
        <ServicesLanding />
      </Suspense>
    </>
  );
}
