import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/container";

const vehicleTypeTiles: { slug: string; label: string; image: string }[] = [
  {
    slug: "economy",
    label: "Economy",
    image: "https://images.unsplash.com/photo-1630716059383-b3203bdda1e4?auto=format&fit=crop&w=700&h=560&q=80",
  },
  {
    slug: "suv",
    label: "SUV",
    image: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=700&h=560&q=80",
  },
  {
    slug: "luxury",
    label: "Luxury",
    image: "https://images.unsplash.com/photo-1764605206511-7a649d9df63b?auto=format&fit=crop&w=700&h=560&q=80",
  },
  {
    slug: "van",
    label: "Van",
    image: "https://images.unsplash.com/photo-1685000842715-a784b80e5ee6?auto=format&fit=crop&w=700&h=560&q=80",
  },
];

export function VehicleTypeCategories() {
  return (
    <Container className="max-w-[64rem] py-10 sm:py-12 lg:px-6">
      <h2 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">
        What kind of ride do you need?
      </h2>
      <p className="mt-1 text-muted-foreground">
        Pick a vehicle type to see available rentals
      </p>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {vehicleTypeTiles.map((tile) => (
          <Link key={tile.slug} href={`/cars?category=${tile.slug}`} className="group flex flex-col gap-3">
            <div className="relative aspect-[5/4] w-full overflow-hidden rounded-md">
              <Image
                src={tile.image}
                alt={tile.label}
                fill
                sizes="(min-width: 640px) 25vw, 45vw"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </div>
            <span className="font-heading text-base font-semibold text-foreground">{tile.label}</span>
          </Link>
        ))}
      </div>
    </Container>
  );
}
