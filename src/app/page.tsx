import { VerticalHero } from "@/components/vertical-hero";
import { WhyGHBucketlist } from "@/components/home/why-ghbucketlist";
import { BrowseByPropertyType } from "@/components/stay/browse-by-property-type";
import { TrendingDestinations } from "@/components/home/trending-destinations";
import { TripPlanner } from "@/components/home/trip-planner";
import { CtaBanner } from "@/components/home/cta-banner";

export default function Home() {
  return (
    <>
      <VerticalHero
        activeTab="stays"
        headline="Find your next stay"
        subheading="Search low prices on hotels, homes and much more..."
      />
      <WhyGHBucketlist />
      <BrowseByPropertyType />
      <TrendingDestinations />
      <TripPlanner />
      <CtaBanner />
    </>
  );
}
