import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { properties, getPropertyBySlug } from "@/data/properties";
import { getPropertyReviews } from "@/data/property-reviews";
import { getPropertyHost } from "@/lib/stay-repository";
import { PropertyDetailWithOverride } from "@/components/stay/property-detail-with-override";

export function generateStaticParams() {
  return properties.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const property = getPropertyBySlug(slug);
  if (!property) return {};
  return {
    title: property.title,
    description: property.description,
    openGraph: { title: property.title, description: property.description, images: [property.images[0]] },
  };
}

export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const property = getPropertyBySlug(slug);
  if (!property) notFound();

  const host = getPropertyHost(property);
  const reviews = getPropertyReviews(property.id);

  return <PropertyDetailWithOverride property={property} host={host} reviews={reviews} />;
}
