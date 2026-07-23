"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/container";
import { CarDetailContent } from "@/components/cars/car-detail-content";
import { useHostCreatedCars } from "@/lib/host-cars-store";
import { getCarVendor } from "@/lib/car-repository";

export default function CarPreviewPage() {
  return (
    <Suspense fallback={null}>
      <CarPreviewContent />
    </Suspense>
  );
}

function CarPreviewContent() {
  const searchParams = useSearchParams();
  const slug = searchParams.get("slug") ?? "";
  const hostCreated = useHostCreatedCars();
  const car = hostCreated.find((c) => c.slug === slug);

  if (!car) {
    return (
      <Container className="flex flex-col items-center py-24 text-center">
        <h1 className="font-heading text-2xl font-bold text-foreground">Car not found</h1>
        <p className="mt-2 text-muted-foreground">This listing doesn&apos;t exist or may have been removed.</p>
        <Button asChild className="mt-6">
          <Link href="/cars">Browse Car Rentals</Link>
        </Button>
      </Container>
    );
  }

  return <CarDetailContent car={car} vendor={getCarVendor(car)} />;
}
