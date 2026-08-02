import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getExperienceCategory, getExperienceHost } from "@/lib/repository";
import { getExperienceListingBySlug } from "@/lib/supabase/listings-server";
import { ActivityDetailWithOverride } from "@/components/activities/detail/activity-detail-with-override";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const experience = await getExperienceListingBySlug(slug);
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
  const experience = await getExperienceListingBySlug(slug);
  if (!experience) notFound();

  const category = getExperienceCategory(experience);
  const host = getExperienceHost(experience);

  return <ActivityDetailWithOverride experience={experience} category={category} host={host} />;
}
