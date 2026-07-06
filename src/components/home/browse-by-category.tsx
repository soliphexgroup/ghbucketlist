import Link from "next/link";
import { Container } from "@/components/container";
import { CategoryIcon } from "@/components/category-icon";
import { categories } from "@/data/categories";

export function BrowseByCategory() {
  const visibleCategories = categories.filter((category) => category.slug !== "history");

  return (
    <section className="bg-secondary/40 py-16 sm:py-20">
      <Container>
        <div className="text-center">
          <h2 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">
            Browse by Category
          </h2>
          <p className="mt-1 text-muted-foreground">
            Find the perfect activity for your interests
          </p>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {visibleCategories.map((category) => (
            <Link
              key={category.id}
              href={`/activities?category=${category.slug}`}
              className="group flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-5 text-center shadow-[0_2px_12px_rgba(0,0,0,0.06)] transition-shadow duration-200 hover:shadow-[0_8px_24px_rgba(0,0,0,0.1)]"
            >
              <span
                className="flex size-12 items-center justify-center rounded-full transition-transform duration-200 group-hover:scale-105"
                style={{ backgroundColor: `${category.colorHex}1A`, color: category.colorHex }}
              >
                <CategoryIcon name={category.icon} className="size-6" />
              </span>
              <span className="text-sm font-semibold text-foreground">
                {category.name}
              </span>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}
