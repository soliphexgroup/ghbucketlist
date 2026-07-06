import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  experiences,
  getExperienceBySlug,
} from "@/data/experiences";
import { getExperienceCategory, getExperienceHost, listReviewsFor } from "@/lib/repository";
import { ActivityDetailWithOverride } from "@/components/activities/detail/activity-detail-with-override";

export function generateStaticParams() {
  return experiences.map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const experience = getExperienceBySlug(slug);
  if (!experience) return {};
  return {
    title: experience.title,
    description: experience.shortDescription,
    openGraph: {
      title: experience.title,
      description: experience.shortDescription,
      images: [experience.images[0]],
    },
  };
}

export default async function ActivityDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const experience = getExperienceBySlug(slug);
  if (!experience) notFound();

  const category = getExperienceCategory(experience);
  const host = getExperienceHost(experience);
  const reviews = listReviewsFor(experience.id);

  return <ActivityDetailWithOverride experience={experience} category={category} host={host} reviews={reviews} />;
}
