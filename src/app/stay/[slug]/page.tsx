import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MobileSearchBar } from "@/components/home/mobile-search-bar";
import { getPropertyReviews } from "@/data/property-reviews";
import { getPropertyHost } from "@/lib/stay-repository";
import { getStayListingBySlug } from "@/lib/supabase/listings-server";
import { PropertyDetailWithOverride } from "@/components/stay/property-detail-with-override";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const property = await getStayListingBySlug(slug);
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
  const property = await getStayListingBySlug(slug);
  if (!property) notFound();

  const host = getPropertyHost(property);
  const reviews = getPropertyReviews(property.id);

  return (
    <>
      {/* Hotels only: the room table has no dates of its own, so the bar is what changes
          them and reprices it. A whole-unit stay picks dates in its booking card. */}
      {Boolean(property.roomTypes?.length) && (
        <Suspense fallback={null}>
          <MobileSearchBar activeTab="stays" mode="current" />
        </Suspense>
      )}
      <PropertyDetailWithOverride property={property} host={host} reviews={reviews} />
    </>
  );
}
