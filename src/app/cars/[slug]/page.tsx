import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Briefcase, ChevronRight, MapPin, Users } from "lucide-react";
import { Container } from "@/components/container";
import { Separator } from "@/components/ui/separator";
import { StarRating } from "@/components/star-rating";
import { Gallery } from "@/components/activities/detail/gallery";
import { VenueMap } from "@/components/activities/detail/venue-map";
import { FeaturesGrid } from "@/components/cars/features-grid";
import { CarBookingWidget } from "@/components/cars/car-booking-widget";
import { cars, getCarBySlug } from "@/data/cars";
import { getCarVendor } from "@/lib/car-repository";

const categoryLabels = { economy: "Economy", suv: "SUV", luxury: "Luxury", van: "Van" };
const cancellationCopy = {
  flexible: "Full refund up to 24 hours before pickup.",
  moderate: "Full refund up to 3 days before pickup.",
  strict: "50% refund up to 5 days before pickup; no refund after.",
};

export function generateStaticParams() {
  return cars.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const car = getCarBySlug(slug);
  if (!car) return {};
  const title = `${car.make} ${car.model} ${car.year}`;
  const description = `Rent the ${title} in ${car.city}. ${car.seats} seats, ${car.transmission} transmission.`;
  return {
    title,
    description,
    openGraph: { title, description, images: [car.images[0]] },
  };
}

export default async function CarDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const car = getCarBySlug(slug);
  if (!car) notFound();

  const vendor = getCarVendor(car);
  const mapQuery = `${car.pickupLocation}, ${car.city}`;
  const title = `${car.make} ${car.model}`;

  return (
    <Container className="py-6 sm:py-8">
      <nav className="mb-5 flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-primary">Home</Link>
        <ChevronRight className="size-3.5" />
        <Link href="/cars" className="hover:text-primary">Car Rental</Link>
        <ChevronRight className="size-3.5" />
        <span className="truncate text-foreground">{title}</span>
      </nav>

      <Gallery images={car.images} title={title} />

      <div className="mt-8 flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold text-secondary-foreground">
            {categoryLabels[car.category]}
          </span>
          <StarRating rating={car.rating} reviewCount={car.reviewCount} />
        </div>
        <h1 className="font-heading text-3xl font-bold text-foreground sm:text-4xl">
          {title} <span className="font-normal text-muted-foreground">{car.year}</span>
        </h1>
        <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin className="size-4" />
          {car.pickupLocation}, {car.city}
        </p>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-[1fr_380px]">
        <div className="flex flex-col gap-10">
          {vendor && (
            <div className="flex items-center gap-3">
              <Image src={vendor.avatarUrl} alt={vendor.name} width={48} height={48} className="size-12 rounded-full object-cover" />
              <div>
                <p className="text-sm text-muted-foreground">Listed by</p>
                <p className="font-heading text-base font-semibold text-foreground">{vendor.name}</p>
              </div>
              <span className="ml-auto text-sm text-muted-foreground">Joined {vendor.joinedYear}</span>
            </div>
          )}

          <div className="flex flex-wrap gap-4">
            <span className="flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-sm text-foreground">
              <Users className="size-4" />
              {car.seats} seats
            </span>
            <span className="flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-sm text-foreground">
              <Briefcase className="size-4" />
              {car.luggage} luggage
            </span>
            <span className="flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-sm text-foreground capitalize">
              {car.transmission}
            </span>
          </div>

          <Separator />

          <section>
            <h2 className="font-heading text-xl font-semibold text-foreground">Features</h2>
            <div className="mt-4">
              <FeaturesGrid features={car.features} />
            </div>
          </section>

          <Separator />

          <section>
            <h2 className="font-heading text-xl font-semibold text-foreground">Rental details</h2>
            <div className="mt-3 grid grid-cols-2 gap-3 text-sm text-muted-foreground sm:grid-cols-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Mileage limit</p>
                <p className="text-foreground">{car.mileageLimitPerDay} km/day</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Min rental</p>
                <p className="text-foreground">{car.minRentalDays} day{car.minRentalDays > 1 ? "s" : ""}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Chauffeur</p>
                <p className="text-foreground">{car.driverAvailable ? "Available" : "Not available"}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Pickup location</p>
                <p className="text-foreground">{car.pickupLocation}</p>
              </div>
            </div>
          </section>

          <Separator />

          <section>
            <h2 className="font-heading text-xl font-semibold text-foreground">Cancellation policy</h2>
            <p className="mt-2 text-sm font-medium capitalize text-foreground">{car.cancellationPolicy}</p>
            <p className="mt-1 text-sm text-muted-foreground">{cancellationCopy[car.cancellationPolicy]}</p>
          </section>

          <Separator />

          <section>
            <h2 className="font-heading text-xl font-semibold text-foreground">Pickup location</h2>
            <p className="mt-2 text-muted-foreground">
              {car.pickupLocation}, {car.city}. Exact meeting point shared after booking.
            </p>
            <div className="mt-4">
              <VenueMap query={mapQuery} />
            </div>
          </section>
        </div>

        <div>
          <Suspense fallback={null}>
            <CarBookingWidget car={car} />
          </Suspense>
        </div>
      </div>
    </Container>
  );
}
