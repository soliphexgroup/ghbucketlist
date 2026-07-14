import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/container";

const categories: { label: string; href: string; image: string }[] = [
  {
    label: "Hotels",
    href: "/stay?type=hotel",
    image: "https://images.unsplash.com/photo-1702255489644-392758161f1f?auto=format&fit=crop&w=526&h=420&q=80",
  },
  {
    label: "Villas",
    href: "/stay?type=vacation",
    image: "https://images.unsplash.com/photo-1632127214676-aa66ef5ddb2d?auto=format&fit=crop&w=526&h=420&q=80",
  },
  {
    label: "Airbnbs",
    href: "/stay?type=apartment",
    image: "https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?auto=format&fit=crop&w=526&h=420&q=80",
  },
  {
    label: "Getaways",
    href: "/stay?sort=rating",
    image: "/images/hero/beach-bar-sunset.jpg",
  },
];

export function BrowseByPropertyType() {
  return (
    <section className="py-6 sm:py-8">
      <Container className="max-w-[64rem] lg:px-6">
        <h2 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">
          Browse by property type
        </h2>

        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {categories.map((item) => (
            <Link key={item.label} href={item.href} className="group flex flex-col gap-3">
              <div className="relative aspect-[5/4] w-full overflow-hidden rounded-lg sm:rounded-2xl">
                <Image
                  src={item.image}
                  alt={item.label}
                  fill
                  sizes="(min-width: 640px) 15vw, 45vw"
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <span className="line-clamp-1 font-heading text-base font-semibold text-foreground">
                {item.label}
              </span>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}
