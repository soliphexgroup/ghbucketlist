import { Suspense } from "react";
import type { Metadata } from "next";
import { VerticalHero } from "@/components/vertical-hero";
import { ThingsToDoLanding } from "@/components/activities/things-to-do-landing";

export const metadata: Metadata = {
  title: "Activities",
  description: "Browse curated experiences and activities in Accra and beyond.",
};

export default function ActivitiesPage() {
  return (
    <>
      <VerticalHero
        activeTab="things-to-do"
        headline="Find things to do"
        subheading="Day trips, tours, attractions, and activities — discover things to do across Accra and beyond."
        showSearch={false}
      />
      <Suspense fallback={null}>
        <ThingsToDoLanding />
      </Suspense>
    </>
  );
}
