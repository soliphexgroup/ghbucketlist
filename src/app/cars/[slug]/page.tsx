import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CarDetailContent } from "@/components/cars/car-detail-content";
import { cars, getCarBySlug } from "@/data/cars";
import { getCarVendor } from "@/lib/car-repository";

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

  return <CarDetailContent car={car} vendor={getCarVendor(car)} />;
}
