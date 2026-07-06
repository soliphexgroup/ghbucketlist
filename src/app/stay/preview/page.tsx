"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/container";
import { PropertyDetailContent } from "@/components/stay/property-detail-content";
import { useHostCreatedProperties } from "@/lib/host-properties-store";
import { getPropertyHost } from "@/lib/stay-repository";
import { getPropertyReviews } from "@/data/property-reviews";

export default function StayPreviewPage() {
  return (
    <Suspense fallback={null}>
      <StayPreviewContent />
    </Suspense>
  );
}

function StayPreviewContent() {
  const searchParams = useSearchParams();
  const slug = searchParams.get("slug") ?? "";
  const hostCreated = useHostCreatedProperties();
  const property = hostCreated.find((p) => p.slug === slug);

  if (!property) {
    return (
      <Container className="flex flex-col items-center py-24 text-center">
        <h1 className="font-heading text-2xl font-bold text-foreground">Property not found</h1>
        <p className="mt-2 text-muted-foreground">This listing doesn&apos;t exist or may have been removed.</p>
        <Button asChild className="mt-6">
          <Link href="/stay">Browse Places to Stay</Link>
        </Button>
      </Container>
    );
  }

  return (
    <PropertyDetailContent
      property={property}
      host={getPropertyHost(property)}
      reviews={getPropertyReviews(property.id)}
    />
  );
}
