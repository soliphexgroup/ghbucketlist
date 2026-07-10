import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/container";

const serviceTypeTiles: { slug: string; label: string; image: string }[] = [
  {
    slug: "carpenter",
    label: "Carpenter",
    image: "https://images.unsplash.com/photo-1567507145544-da3fe1b4f8f9?auto=format&fit=crop&w=700&h=560&q=80",
  },
  {
    slug: "electrician",
    label: "Electrician",
    image: "https://images.unsplash.com/photo-1758101755915-462eddc23f57?auto=format&fit=crop&w=700&h=560&q=80",
  },
  {
    slug: "plumber",
    label: "Plumber",
    image: "https://images.unsplash.com/photo-1676210134188-4c05dd172f89?auto=format&fit=crop&w=700&h=560&q=80",
  },
  {
    slug: "cleaner",
    label: "Cleaner",
    image: "https://images.unsplash.com/photo-1758273238415-01ec03d9ef27?auto=format&fit=crop&w=700&h=560&q=80",
  },
  {
    slug: "welder",
    label: "Welder",
    image: "https://images.unsplash.com/photo-1647586028042-1de4d4a935e6?auto=format&fit=crop&w=700&h=560&q=80",
  },
];

export function ServiceTypeCategories() {
  return (
    <Container className="max-w-[64rem] py-10 sm:py-12 lg:px-6">
      <h2 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">
        What do you need help with?
      </h2>
      <p className="mt-1 text-muted-foreground">
        Pick a service type to see trusted local providers
      </p>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {serviceTypeTiles.map((tile) => (
          <Link key={tile.slug} href={`/services?category=${tile.slug}`} className="group flex flex-col gap-3">
            <div className="relative aspect-[5/4] w-full overflow-hidden rounded-md">
              <Image
                src={tile.image}
                alt={tile.label}
                fill
                sizes="(min-width: 1024px) 20vw, (min-width: 640px) 33vw, 45vw"
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
