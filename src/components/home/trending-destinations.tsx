import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/container";

const destinations = [
  {
    name: "Osu",
    image: "/images/hero/black-star-square-mural.jpg",
    span: "large" as const,
  },
  {
    name: "East Legon",
    image: "/images/hero/accra-aerial-construction.jpg",
    span: "large" as const,
  },
  {
    name: "Jamestown",
    image: "/images/hero/independence-square.jpg",
    span: "small" as const,
  },
  {
    name: "Ridge",
    image: "https://images.unsplash.com/photo-1718766304636-cb9309953a55?auto=format&fit=crop&w=900&h=700&q=80",
    span: "small" as const,
  },
  {
    name: "Cantonments",
    image: "/images/hero/beach-bar-sunset.jpg",
    span: "small" as const,
  },
];

export function TrendingDestinations() {
  return (
    <section className="py-8 sm:py-10">
      <Container className="max-w-[64rem] lg:px-6">
        <h2 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">
          Trending destinations
        </h2>
        <p className="mt-1 text-muted-foreground">
          Most popular neighbourhoods for stays right now
        </p>

        <div className="mt-8 grid grid-cols-6 gap-4">
          {destinations.map((destination) => (
            <Link
              key={destination.name}
              href={`/stay?q=${encodeURIComponent(destination.name)}`}
              className={`group relative overflow-hidden rounded-md ${
                destination.span === "large"
                  ? "col-span-6 h-44 sm:col-span-3 sm:h-52"
                  : "col-span-2 h-48"
              }`}
            >
              <Image
                src={destination.image}
                alt={destination.name}
                fill
                sizes={destination.span === "large" ? "(min-width: 640px) 48vw, 100vw" : "(min-width: 640px) 32vw, 45vw"}
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
              <span className="absolute top-4 left-4 flex items-center gap-2 font-heading text-lg font-bold text-white sm:text-xl">
                {destination.name}
                <span aria-hidden="true">🇬🇭</span>
              </span>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}
