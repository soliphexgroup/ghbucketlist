"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CategoryIcon } from "@/components/category-icon";
import { categories } from "@/data/categories";
import { cn } from "@/lib/utils";

const heroImages = [
  "/images/hero/accra-aerial-construction.jpg",
  "/images/hero/independence-square.jpg",
  "/images/hero/black-star-square-mural.jpg",
  "/images/hero/beach-bar-sunset.jpg",
];

const pillCategories: { slug: string; label: string }[] = [
  { slug: "food-drink", label: "Food & Drink" },
  { slug: "arts-culture", label: "Art & Culture" },
  { slug: "outdoor", label: "Outdoor" },
  { slug: "workshops", label: "Workshops" },
  { slug: "sports-fitness", label: "Sports" },
  { slug: "music", label: "Music" },
  { slug: "nightlife", label: "Nightlife" },
  { slug: "tours", label: "Tours" },
  { slug: "photography", label: "Photography" },
  { slug: "gaming", label: "Gaming" },
  { slug: "parties", label: "Parties" },
];

export function Hero() {
  const [active, setActive] = useState(0);
  const [query, setQuery] = useState("");
  const router = useRouter();

  useEffect(() => {
    const id = setInterval(() => {
      setActive((prev) => (prev + 1) % heroImages.length);
    }, 5500);
    return () => clearInterval(id);
  }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const params = query.trim() ? `?q=${encodeURIComponent(query.trim())}` : "";
    router.push(`/activities${params}`);
  }

  return (
    <section className="relative flex min-h-[560px] items-center justify-center overflow-hidden text-white sm:min-h-[680px] lg:min-h-[720px]">
      {heroImages.map((src, i) => (
        <Image
          key={src}
          src={src}
          alt=""
          fill
          priority
          className={cn(
            "absolute inset-0 object-cover transition-opacity duration-1000 ease-in-out",
            i === active ? "opacity-100" : "opacity-0"
          )}
        />
      ))}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/45 to-black/70" />

      <div className="relative z-10 mx-auto flex w-full max-w-4xl flex-col items-center px-4 py-14 text-center sm:px-6 sm:py-20 lg:py-24">
        <h1 className="font-heading text-3xl font-extrabold leading-tight text-balance [-webkit-text-stroke:0.5px_currentColor] sm:text-5xl lg:text-6xl xl:text-7xl">
          Experience the Best Places to Visit
        </h1>
        <div aria-hidden="true" className="mt-3 h-0.5 w-[155px] rounded-full bg-white/90 sm:mt-4 sm:w-[207px]" />
        <p className="mt-3 max-w-2xl text-balance text-sm text-white/85 sm:mt-4 sm:text-lg">
          Find things to do in your city. Try new things, meet new people, explore the
          best curated experiences from painting, food and more.
        </p>

        <form
          onSubmit={handleSearch}
          className="mt-6 flex w-full max-w-xl items-center gap-2 rounded-full bg-white p-1.5 pl-4 shadow-xl sm:mt-8 sm:p-2 sm:pl-5"
        >
          <Search className="size-4 shrink-0 text-muted-foreground sm:size-5" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search experiences…"
            className="h-9 border-0 bg-transparent p-0 text-sm text-foreground shadow-none focus-visible:ring-0 sm:h-10 sm:text-base"
          />
          <Button
            type="submit"
            className="h-9 shrink-0 rounded-full px-4 text-sm sm:h-10 sm:px-6 sm:text-base"
          >
            Search
          </Button>
        </form>

        <div className="mt-5 flex max-w-2xl flex-wrap justify-center gap-1.5 sm:mt-6 sm:gap-2">
          {pillCategories.map(({ slug, label }) => {
            const category = categories.find((c) => c.slug === slug);
            if (!category) return null;
            return (
              <a
                key={slug}
                href={`/activities?category=${slug}`}
                className="flex items-center gap-1.5 rounded-full border border-white/30 bg-white/10 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm transition-colors duration-200 hover:bg-white/25 sm:px-3.5 sm:py-1.5 sm:text-sm"
              >
                <CategoryIcon name={category.icon} className="size-3 sm:size-3.5" />
                {label}
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}
