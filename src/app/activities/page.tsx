import { Suspense } from "react";
import type { Metadata } from "next";
import { ActivitiesBrowser } from "@/components/activities/activities-browser";

export const metadata: Metadata = {
  title: "Activities",
  description: "Browse curated experiences and activities in Accra and beyond.",
};

export default function ActivitiesPage() {
  return (
    <Suspense fallback={null}>
      <ActivitiesBrowser />
    </Suspense>
  );
}
