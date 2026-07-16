import { Suspense } from "react";
import type { Metadata } from "next";
import { VerticalHero } from "@/components/vertical-hero";
import { MobileHero } from "@/components/home/mobile-hero";
import { MobileSearchBar } from "@/components/home/mobile-search-bar";
import { ThingsToDoLanding } from "@/components/activities/things-to-do-landing";

export const metadata: Metadata = {
  title: "Activities",
  description: "Browse curated experiences and activities in Accra and beyond.",
};

export default function ActivitiesPage() {
  return (
    <>
      <Suspense fallback={null}>
        <MobileHero
          activeTab="things-to-do"
          headline="Find things to do"
          subheading="Day trips, tours, attractions, and activities — discover things to do across Accra and beyond."
        />
      </Suspense>
      <Suspense fallback={null}>
        <MobileSearchBar activeTab="things-to-do" />
      </Suspense>
      <div className="hidden lg:block">
        <VerticalHero
          activeTab="things-to-do"
          headline="Find things to do"
          subheading="Day trips, tours, attractions, and activities — discover things to do across Accra and beyond."
          showSearch={false}
        />
      </div>
      <Suspense fallback={null}>
        <ThingsToDoLanding />
      </Suspense>
    </>
  );
}
