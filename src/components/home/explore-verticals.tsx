import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/container";

const verticals = [
  {
    title: "Places to Stay",
    description: "Hotels, apartments, and vacation homes across Accra.",
    href: "/stay",
    image: "https://images.unsplash.com/photo-1702255489644-392758161f1f?auto=format&fit=crop&w=800&h=600&q=80",
  },
  {
    title: "Car Rental",
    description: "Self-drive and chauffeur car rentals for any occasion.",
    href: "/cars",
    image: "https://images.unsplash.com/photo-1630716059383-b3203bdda1e4?auto=format&fit=crop&w=800&h=600&q=80",
  },
  {
    title: "Curated Trips",
    description: "Personalized, fully-planned travel across three service tiers.",
    href: "/trips",
    image: "https://images.unsplash.com/photo-1494783367193-149034c05e8f?auto=format&fit=crop&w=800&h=600&q=80",
  },
  {
    title: "Handyman Services",
    description: "Trusted carpenters, electricians, plumbers, and more, on demand.",
    href: "/services",
    image: "https://images.unsplash.com/photo-1567507145544-da3fe1b4f8f9?auto=format&fit=crop&w=800&h=600&q=80",
  },
];

export function ExploreVerticals() {
  return (
    <section className="py-16 sm:py-20">
      <Container>
        <div className="text-center">
          <h2 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">
            More on GH Bucketlist
          </h2>
          <p className="mt-1 text-muted-foreground">
            Beyond activities — everything else you need for your trip
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {verticals.map((vertical) => (
            <Link
              key={vertical.href}
              href={vertical.href}
              className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-[0_2px_12px_rgba(0,0,0,0.08)] transition-shadow duration-200 hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)]"
            >
              <div className="relative aspect-4/3 w-full overflow-hidden">
                <Image
                  src={vertical.image}
                  alt={vertical.title}
                  fill
                  sizes="(min-width: 1024px) 280px, (min-width: 640px) 45vw, 90vw"
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <div className="flex flex-1 flex-col gap-2 p-5">
                <h3 className="font-heading text-base font-semibold text-foreground">{vertical.title}</h3>
                <p className="text-sm text-muted-foreground">{vertical.description}</p>
                <span className="mt-auto flex items-center gap-1 pt-2 text-sm font-medium text-primary">
                  Explore
                  <ArrowRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}
