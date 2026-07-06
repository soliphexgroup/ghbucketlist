"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/container";
import { ActivityDetailContent } from "@/components/activities/detail/activity-detail-content";
import { useHostCreatedExperiences } from "@/lib/host-experiences-store";
import { getExperienceCategory, getExperienceHost, listReviewsFor } from "@/lib/repository";

export function HostCreatedExperienceDetail() {
  const searchParams = useSearchParams();
  const slug = searchParams.get("slug") ?? "";
  const hostCreated = useHostCreatedExperiences();
  const experience = hostCreated.find((e) => e.slug === slug);

  if (!experience) {
    return (
      <Container className="flex flex-col items-center py-24 text-center">
        <h1 className="font-heading text-2xl font-bold text-foreground">Experience not found</h1>
        <p className="mt-2 text-muted-foreground">
          This listing doesn&apos;t exist or may have been removed.
        </p>
        <Button asChild className="mt-6">
          <Link href="/activities">Browse Activities</Link>
        </Button>
      </Container>
    );
  }

  const category = getExperienceCategory(experience);
  const host = getExperienceHost(experience);
  const reviews = listReviewsFor(experience.id);

  return <ActivityDetailContent experience={experience} category={category} host={host} reviews={reviews} />;
}
