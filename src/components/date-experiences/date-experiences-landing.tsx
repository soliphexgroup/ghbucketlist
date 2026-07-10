"use client";

import { useSearchParams } from "next/navigation";
import { DateExperienceCategories } from "@/components/date-experiences/date-experience-categories";
import { ActivitiesBrowser } from "@/components/activities/activities-browser";

export function DateExperiencesLanding() {
  const searchParams = useSearchParams();
  const hasFilters = searchParams.toString().length > 0;

  if (!hasFilters) return <DateExperienceCategories />;

  return (
    <ActivitiesBrowser
      basePath="/date-experiences"
      title="Date Experiences"
      description="Curated outings for two across Accra and beyond"
    />
  );
}
