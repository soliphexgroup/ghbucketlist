import { Suspense } from "react";
import { VerticalHero } from "@/components/vertical-hero";
import { MobileHero } from "@/components/home/mobile-hero";
import { MobileSearchBar } from "@/components/home/mobile-search-bar";
import { ThingsToDoLanding } from "@/components/activities/things-to-do-landing";

export default function Home() {
  return (
    <>
      <Suspense fallback={null}>
        <MobileHero
          activeTab="things-to-do"
          headline="Discover what's happening"
          subheading="Day trips, tours, attractions, and activities — discover things to do across Accra and beyond."
        />
      </Suspense>
      <Suspense fallback={null}>
        <MobileSearchBar activeTab="things-to-do" showOnDesktop />
      </Suspense>
      <div className="hidden lg:block">
        <VerticalHero
          activeTab="things-to-do"
          headline="Discover what's happening"
          subheading="Day trips, tours, attractions, and activities — discover things to do across Accra and beyond."
        />
      </div>
      <Suspense fallback={null}>
        <ThingsToDoLanding />
      </Suspense>
    </>
  );
}
