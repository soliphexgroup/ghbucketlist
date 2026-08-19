"use client";

import { useSearchParams } from "next/navigation";
import { MobileHero } from "@/components/home/mobile-hero";
import { MobileSearchBar } from "@/components/home/mobile-search-bar";
import { VerticalHero } from "@/components/vertical-hero";
import { WhyGHBucketlist } from "@/components/home/why-ghbucketlist";
import { HotelsCarousels } from "@/components/stay/hotels-carousels";
import { BrowseByPropertyType } from "@/components/stay/browse-by-property-type";
import { TrendingDestinations } from "@/components/home/trending-destinations";
import { TripPlanner } from "@/components/home/trip-planner";
import { CtaBanner } from "@/components/home/cta-banner";
import { StayBrowser } from "@/components/stay/stay-browser";

/**
 * The Stays tab landing. Bare `/stay` shows the full marketing landing (hero + sections); once a
 * search has run (dates or a filter in the URL) it shows real results instead. The hero always
 * stays on top so it carries its own tabs bar (see PAGES_WITH_OWN_HERO).
 */
export function StayLanding() {
  const params = useSearchParams();
  const searched = Boolean(
    params.get("checkin") || params.get("checkout") || params.has("type") || params.has("sort")
  );

  return (
    <>
      <MobileHero
        activeTab="stays"
        headline="Find your next stay"
        subheading="Book stays, date experiences, activities, rentals and trusted local services."
      />
      <div className="hidden lg:block">
        <VerticalHero
          activeTab="stays"
          headline="Find your next stay"
          subheading="Search low prices on hotels, homes and much more..."
        />
      </div>

      {searched ? (
        <>
          <MobileSearchBar activeTab="stays" showOnDesktop />
          <StayBrowser />
        </>
      ) : (
        <>
          <WhyGHBucketlist />
          <HotelsCarousels />
          <BrowseByPropertyType />
          <TrendingDestinations />
          <TripPlanner />
          <CtaBanner />
        </>
      )}
    </>
  );
}
