"use client";

import { ActivityDetailContent } from "@/components/activities/detail/activity-detail-content";
import { useHostCreatedExperiences } from "@/lib/host-experiences-store";
import { getExperienceCategory, getExperienceHost } from "@/lib/repository";
import type { Category, Experience, Host } from "@/lib/types";

export function ActivityDetailWithOverride({
  experience,
  category,
  host,
}: {
  experience: Experience;
  category: Category | undefined;
  host: Host | undefined;
}) {
  const created = useHostCreatedExperiences();
  const override = created.find((e) => e.id === experience.id);

  if (!override) {
    return <ActivityDetailContent experience={experience} category={category} host={host} />;
  }

  return (
    <ActivityDetailContent
      experience={override}
      category={getExperienceCategory(override)}
      host={getExperienceHost(override)}
    />
  );
}
