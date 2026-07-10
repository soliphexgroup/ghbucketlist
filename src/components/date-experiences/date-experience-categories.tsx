import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/container";

const categoryTiles: { slug: string; label: string; image: string }[] = [
  {
    slug: "food-drink",
    label: "Dinner & Drinks",
    image: "https://images.unsplash.com/photo-1758346972070-547c770d96ab?auto=format&fit=crop&w=700&h=560&q=80",
  },
  {
    slug: "arts-culture",
    label: "Arts & Culture",
    image: "https://images.unsplash.com/photo-1758380742154-44738eb92832?auto=format&fit=crop&w=700&h=560&q=80",
  },
  {
    slug: "nightlife",
    label: "Nightlife",
    image: "https://images.unsplash.com/photo-1749523593131-74d617633dd7?auto=format&fit=crop&w=700&h=560&q=80",
  },
  {
    slug: "outdoor",
    label: "Outdoor Dates",
    image: "https://images.unsplash.com/photo-1616878443605-aca041c01763?auto=format&fit=crop&w=700&h=560&q=80",
  },
];

export function DateExperienceCategories() {
  return (
    <Container className="max-w-6xl py-10 sm:py-12 lg:px-6">
      <h2 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">
        What kind of date are you planning?
      </h2>
      <p className="mt-1 text-muted-foreground">
        Pick a vibe to see curated experiences for two
      </p>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {categoryTiles.map((tile) => (
          <Link
            key={tile.slug}
            href={`/date-experiences?category=${tile.slug}`}
            className="group flex flex-col gap-3"
          >
            <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl">
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
