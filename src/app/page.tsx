import { VerticalHero } from "@/components/vertical-hero";
import { MobileHero } from "@/components/home/mobile-hero";
import { WhyGHBucketlist } from "@/components/home/why-ghbucketlist";
import { BrowseByPropertyType } from "@/components/stay/browse-by-property-type";
import { TrendingDestinations } from "@/components/home/trending-destinations";
import { TripPlanner } from "@/components/home/trip-planner";
import { CtaBanner } from "@/components/home/cta-banner";

export default function Home() {
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
      <WhyGHBucketlist />
      <BrowseByPropertyType />
      <TrendingDestinations />
      <TripPlanner />
      <CtaBanner />
    </>
  );
}
