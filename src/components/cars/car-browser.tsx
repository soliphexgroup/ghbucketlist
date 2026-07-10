"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { SlidersHorizontal } from "lucide-react";
import { Container } from "@/components/container";
import { CarCard } from "@/components/cars/car-card";
import { CarFiltersSidebar } from "@/components/cars/car-filters-sidebar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { listCars, carPriceBounds, type CarFilters } from "@/lib/car-repository";
import type { Car, CarCategory } from "@/lib/car-types";

export type CarFilterState = Required<
  Pick<CarFilters, "q" | "categories" | "maxPrice" | "features" | "driverAvailableOnly" | "instantBookOnly" | "sort">
> & { seats: number; transmission?: Car["transmission"] };

const sortOptions: { value: NonNullable<CarFilters["sort"]>; label: string }[] = [
  { value: "recommended", label: "Recommended" },
  { value: "price-asc", label: "Price (low to high)" },
  { value: "price-desc", label: "Price (high to low)" },
  { value: "rating", label: "Highest rated" },
];

const carCategories: CarCategory[] = ["economy", "suv", "luxury", "van"];

function defaultFilters(): CarFilterState {
  return {
    q: "",
    categories: [] as CarCategory[],
    maxPrice: carPriceBounds().max,
    features: [],
    driverAvailableOnly: false,
    instantBookOnly: false,
    sort: "recommended",
    seats: 1,
    transmission: undefined,
  };
}

function CarBrowserInner({
  initialCategory,
  initialQ,
}: {
  initialCategory: CarCategory | null;
  initialQ: string;
}) {
  const [filters, setFilters] = useState<CarFilterState>(() => ({
    ...defaultFilters(),
    categories: initialCategory ? [initialCategory] : [],
    q: initialQ,
  }));
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const cars = useMemo(
    () =>
      listCars({
        q: filters.q,
        categories: filters.categories,
        maxPrice: filters.maxPrice,
        seats: filters.seats > 1 ? filters.seats : undefined,
        transmission: filters.transmission,
        features: filters.features,
        driverAvailableOnly: filters.driverAvailableOnly,
        instantBookOnly: filters.instantBookOnly,
        sort: filters.sort,
      }),
    [filters]
  );

  function updateFilters(next: Partial<CarFilterState>) {
    setFilters((prev) => ({ ...prev, ...next }));
  }

  function clearFilters() {
    setFilters(defaultFilters());
  }

  return (
    <Container className="py-8 sm:py-10">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">
            Find the right car for any occasion
          </h1>
          <p className="mt-1 text-muted-foreground">
            Self-drive and chauffeur car rentals across Accra
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="lg:hidden">
                <SlidersHorizontal className="size-4" />
                Filters
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Filters</SheetTitle>
              </SheetHeader>
              <div className="px-4 pb-8">
                <CarFiltersSidebar filters={filters} onChange={updateFilters} onClear={clearFilters} />
              </div>
            </SheetContent>
          </Sheet>

          <Select value={filters.sort} onValueChange={(value) => updateFilters({ sort: value as CarFilterState["sort"] })}>
            <SelectTrigger className="w-[190px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[260px_1fr]">
        <aside className="hidden lg:block">
          <CarFiltersSidebar filters={filters} onChange={updateFilters} onClear={clearFilters} />
        </aside>

        <div>
          <p className="mb-5 text-sm text-muted-foreground">
            Showing {cars.length} car{cars.length === 1 ? "" : "s"}
          </p>

          {cars.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-24 text-center">
              <p className="font-heading text-lg font-semibold text-foreground">
                No cars match your filters
              </p>
              <p className="mt-1 text-sm text-muted-foreground">Try adjusting or clearing your filters.</p>
              <Button variant="outline" className="mt-4" onClick={clearFilters}>
                Clear all filters
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {cars.map((car) => (
                <CarCard key={car.id} car={car} />
              ))}
            </div>
          )}
        </div>
      </div>
    </Container>
  );
}

export function CarBrowser() {
  const params = useSearchParams();
  const categoryParam = params.get("category");
  const initialCategory = (carCategories as string[]).includes(categoryParam ?? "")
    ? (categoryParam as CarCategory)
    : null;
  const initialQ = params.get("q") ?? "";

  return (
    <CarBrowserInner
      key={`${initialCategory ?? "all"}-${initialQ}`}
      initialCategory={initialCategory}
      initialQ={initialQ}
    />
  );
}
