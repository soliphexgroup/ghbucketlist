import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/container";

const categoryTiles: { slug: string; label: string; image: string }[] = [
  {
    slug: "outdoor",
    label: "Outdoor Adventures",
    image: "https://images.unsplash.com/photo-1616878443605-aca041c01763?auto=format&fit=crop&w=700&h=560&q=80",
  },
  {
    slug: "food-drink",
    label: "Food & Drink",
    image: "https://images.unsplash.com/photo-1758346972070-547c770d96ab?auto=format&fit=crop&w=700&h=560&q=80",
  },
  {
    slug: "arts-culture",
    label: "Arts & Culture",
    image: "https://images.unsplash.com/photo-1758380742154-44738eb92832?auto=format&fit=crop&w=700&h=560&q=80",
  },
  {
    slug: "sports-fitness",
    label: "Sports & Fitness",
    image: "https://images.unsplash.com/photo-1518310383802-640c2de311b2?auto=format&fit=crop&w=700&h=560&q=80",
  },
  {
    slug: "nightlife",
    label: "Nightlife",
    image: "https://images.unsplash.com/photo-1749523593131-74d617633dd7?auto=format&fit=crop&w=700&h=560&q=80",
  },
  {
    slug: "music",
    label: "Music & Concerts",
    image: "https://images.unsplash.com/photo-1758550445758-165aeab5b26e?auto=format&fit=crop&w=700&h=560&q=80",
  },
  {
    slug: "tours",
    label: "Tours & Sightseeing",
    image: "https://images.unsplash.com/photo-1614105561029-994eebfc29ac?auto=format&fit=crop&w=700&h=560&q=80",
  },
  {
    slug: "photography",
    label: "Photography",
    image: "https://images.unsplash.com/photo-1513031300226-c8fb12de9ade?auto=format&fit=crop&w=700&h=560&q=80",
  },
  {
    slug: "cycling",
    label: "Cycling",
    image: "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=700&h=560&q=80",
  },
  {
    slug: "gaming",
    label: "Gaming",
    image: "https://images.unsplash.com/photo-1677188010559-0667a1ed33a0?auto=format&fit=crop&w=700&h=560&q=80",
  },
  {
    slug: "history",
    label: "History & Heritage",
    image: "https://images.unsplash.com/photo-1753600517924-331b18192f4c?auto=format&fit=crop&w=700&h=560&q=80",
  },
  {
    slug: "parties",
    label: "Parties & Events",
    image: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=700&h=560&q=80",
  },
  {
    slug: "workshops",
    label: "Workshops",
    image: "https://images.unsplash.com/photo-1757085242652-f8cd4d3de889?auto=format&fit=crop&w=700&h=560&q=80",
  },
];

export function ThingsToDoCategories() {
  return (
    <Container className="max-w-6xl py-10 sm:py-12 lg:px-6">
      <h2 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">
        What are you in the mood for?
      </h2>
      <p className="mt-1 text-muted-foreground">
        Pick a category to see what&apos;s on in Accra and beyond
      </p>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {categoryTiles.map((tile) => (
          <Link key={tile.slug} href={`/activities?category=${tile.slug}`} className="group flex flex-col gap-3">
            <div className="relative aspect-[5/4] w-full overflow-hidden rounded-2xl">
              <Image
                src={tile.image}
                alt={tile.label}
                fill
                sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 45vw"
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
