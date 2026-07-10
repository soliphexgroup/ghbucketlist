import { Suspense } from "react";
import type { Metadata } from "next";
import { VerticalHero } from "@/components/vertical-hero";
import { DateExperiencesLanding } from "@/components/date-experiences/date-experiences-landing";

export const metadata: Metadata = {
  title: "Date Experiences",
  description: "Curated romantic outings and experiences for two, across Accra and beyond.",
};

export default function DateExperiencesPage() {
  return (
    <>
      <VerticalHero
        activeTab="date-experiences"
        headline="Plan the perfect date"
        subheading="Curated romantic outings and experiences for two, across Accra and beyond."
        showSearch={false}
      />
      <Suspense fallback={null}>
        <DateExperiencesLanding />
      </Suspense>
    </>
  );
}
