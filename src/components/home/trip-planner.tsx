"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { Container } from "@/components/container";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type Location = { name: string; distanceKm: number; image: string };
type Vibe = { slug: string; label: string; locations: Location[] };

const villaImage =
  "https://images.unsplash.com/photo-1632127214676-aa66ef5ddb2d?auto=format&fit=crop&w=400&h=400&q=80";

// Every location here actually has real experiences tagged to it in that category —
// no city is shown unless there's real data behind it.
const primaryVibes: Vibe[] = [
  {
    slug: "food-drink",
    label: "Food & Cooking",
    locations: [
      { name: "Osu", distanceKm: 3, image: "/images/hero/black-star-square-mural.jpg" },
      { name: "Cantonments", distanceKm: 5, image: villaImage },
      { name: "Airport Residential", distanceKm: 9, image: villaImage },
    ],
  },
  {
    slug: "arts-culture",
    label: "Arts & Culture",
    locations: [
      { name: "Osu", distanceKm: 3, image: "/images/hero/black-star-square-mural.jpg" },
      { name: "Jamestown", distanceKm: 4, image: "/images/hero/independence-square.jpg" },
    ],
  },
  {
    slug: "history",
    label: "Historical Expeditions",
    locations: [
      { name: "Jamestown", distanceKm: 4, image: "/images/hero/independence-square.jpg" },
      {
        name: "Adabraka",
        distanceKm: 2,
        image: "https://images.unsplash.com/photo-1630386226447-af0a955c1009?auto=format&fit=crop&w=400&h=400&q=80",
      },
    ],
  },
  {
    slug: "nightlife",
    label: "Nightlife & Fun",
    locations: [
      {
        name: "Ridge",
        distanceKm: 2,
        image: "https://images.unsplash.com/photo-1718766304636-cb9309953a55?auto=format&fit=crop&w=400&h=400&q=80",
      },
    ],
  },
  {
    slug: "outdoor",
    label: "Hiking Adventures",
    locations: [
      {
        name: "Aburi",
        distanceKm: 32,
        image: "https://images.unsplash.com/photo-1616878443605-aca041c01763?auto=format&fit=crop&w=400&h=400&q=80",
      },
    ],
  },
  {
    slug: "parties",
    label: "Festivals & Events",
    locations: [{ name: "Cantonments", distanceKm: 5, image: villaImage }],
  },
];

const moreVibes: Vibe[] = [
  {
    slug: "sports-fitness",
    label: "Sports & Fitness",
    locations: [
      { name: "La", distanceKm: 6, image: "/images/hero/beach-bar-sunset.jpg" },
      { name: "Osu", distanceKm: 3, image: "/images/hero/black-star-square-mural.jpg" },
    ],
  },
  {
    slug: "gaming",
    label: "Gaming",
    locations: [{ name: "East Legon", distanceKm: 12, image: "/images/hero/accra-aerial-construction.jpg" }],
  },
  {
    slug: "cycling",
    label: "Cycling",
    locations: [{ name: "East Legon", distanceKm: 12, image: "/images/hero/accra-aerial-construction.jpg" }],
  },
  {
    slug: "workshops",
    label: "Workshops",
    locations: [{ name: "Osu", distanceKm: 3, image: "/images/hero/black-star-square-mural.jpg" }],
  },
  {
    slug: "photography",
    label: "Photography",
    locations: [{ name: "Labone", distanceKm: 4, image: villaImage }],
  },
];

const allVibes = [...primaryVibes, ...moreVibes];

export function TripPlanner() {
  const [activeSlug, setActiveSlug] = useState(primaryVibes[0].slug);
  const active = allVibes.find((v) => v.slug === activeSlug)!;
  const isMoreActive = moreVibes.some((v) => v.slug === activeSlug);

  return (
    <section className="py-8 sm:py-10">
      <Container className="max-w-[64rem] lg:px-6">
        <h2 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">
          Quick and easy trip planner
        </h2>
        <p className="mt-1 text-muted-foreground">
          Pick a vibe and explore the top destinations in Ghana
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-2">
          {primaryVibes.map((vibe) => (
            <button
              key={vibe.slug}
              type="button"
              onClick={() => setActiveSlug(vibe.slug)}
              className={cn(
                "rounded-full border px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors duration-200",
                activeSlug === vibe.slug
                  ? "border-primary bg-accent text-primary"
                  : "border-transparent text-foreground hover:bg-muted"
              )}
            >
              {vibe.label}
            </button>
          ))}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className={cn(
                  "flex items-center gap-1 rounded-full border px-4 py-2 text-sm font-semibold whitespace-nowrap transition-colors duration-200",
                  isMoreActive
                    ? "border-primary bg-accent text-primary"
                    : "border-transparent text-foreground hover:bg-muted"
                )}
              >
                More
                <ChevronDown className="size-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {moreVibes.map((vibe) => (
                <DropdownMenuItem key={vibe.slug} onSelect={() => setActiveSlug(vibe.slug)}>
                  {vibe.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="mt-6 flex gap-4 overflow-x-auto pb-2">
          {active.locations.map((location) => (
            <Link
              key={location.name}
              href={`/activities?category=${active.slug}&neighbourhood=${encodeURIComponent(location.name)}`}
              className="group flex w-36 shrink-0 flex-col gap-2 sm:w-44"
            >
              <div className="relative aspect-square w-full overflow-hidden rounded-md">
                <Image
                  src={location.image}
                  alt={location.name}
                  fill
                  sizes="176px"
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <div>
                <p className="flex items-center gap-1.5 font-heading text-sm font-semibold text-foreground">
                  {location.name}
                  <span aria-hidden="true">🇬🇭</span>
                </p>
                <p className="text-xs text-muted-foreground">{location.distanceKm} km away</p>
              </div>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}
