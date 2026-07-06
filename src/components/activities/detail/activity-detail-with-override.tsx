"use client";

import { ActivityDetailContent } from "@/components/activities/detail/activity-detail-content";
import { useHostCreatedExperiences } from "@/lib/host-experiences-store";
import { getExperienceCategory, getExperienceHost, listReviewsFor } from "@/lib/repository";
import type { Category, Experience, Host, Review } from "@/lib/types";

export function ActivityDetailWithOverride({
  experience,
  category,
  host,
  reviews,
}: {
  experience: Experience;
  category: Category | undefined;
  host: Host | undefined;
  reviews: Review[];
}) {
  const created = useHostCreatedExperiences();
  const override = created.find((e) => e.id === experience.id);

  if (!override) {
    return <ActivityDetailContent experience={experience} category={category} host={host} reviews={reviews} />;
  }

  return (
    <ActivityDetailContent
      experience={override}
      category={getExperienceCategory(override)}
      host={getExperienceHost(override)}
      reviews={listReviewsFor(override.id)}
    />
  );
}
