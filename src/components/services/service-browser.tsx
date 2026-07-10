"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { SlidersHorizontal } from "lucide-react";
import { Container } from "@/components/container";
import { ProviderCard } from "@/components/services/provider-card";
import { ServiceFiltersSidebar } from "@/components/services/service-filters-sidebar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { listProviders, type ServiceFilters } from "@/lib/service-repository";
import { serviceCategories } from "@/data/service-categories";
import type { ServiceCategory } from "@/lib/service-types";

export type ServiceFilterState = Required<
  Pick<ServiceFilters, "q" | "categories" | "verifiedOnly" | "sort">
> & { minRating?: number };

const sortOptions: { value: NonNullable<ServiceFilters["sort"]>; label: string }[] = [
  { value: "recommended", label: "Recommended" },
  { value: "rate-asc", label: "Rate (low to high)" },
  { value: "rate-desc", label: "Rate (high to low)" },
  { value: "rating", label: "Highest rated" },
  { value: "response-time", label: "Fastest response" },
];

function defaultFilters(): ServiceFilterState {
  return {
    q: "",
    categories: [] as ServiceCategory[],
    verifiedOnly: false,
    sort: "recommended",
    minRating: undefined,
  };
}

function ServiceBrowserInner({
  initialCategory,
  initialQ,
}: {
  initialCategory: ServiceCategory | null;
  initialQ: string;
}) {
  const [filters, setFilters] = useState<ServiceFilterState>(() => ({
    ...defaultFilters(),
    categories: initialCategory ? [initialCategory] : [],
    q: initialQ,
  }));
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const providers = useMemo(
    () =>
      listProviders({
        q: filters.q,
        categories: filters.categories,
        verifiedOnly: filters.verifiedOnly,
        minRating: filters.minRating,
        sort: filters.sort,
      }),
    [filters]
  );

  function updateFilters(next: Partial<ServiceFilterState>) {
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
            Trusted local professionals, on demand
          </h1>
          <p className="mt-1 text-muted-foreground">
            Carpenters, electricians, plumbers, cleaners, and welders across Accra
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
                <ServiceFiltersSidebar filters={filters} onChange={updateFilters} onClear={clearFilters} />
              </div>
            </SheetContent>
          </Sheet>

          <Select value={filters.sort} onValueChange={(value) => updateFilters({ sort: value as ServiceFilterState["sort"] })}>
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
          <ServiceFiltersSidebar filters={filters} onChange={updateFilters} onClear={clearFilters} />
        </aside>

        <div>
          <p className="mb-5 text-sm text-muted-foreground">
            Showing {providers.length} provider{providers.length === 1 ? "" : "s"}
          </p>

          {providers.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-24 text-center">
              <p className="font-heading text-lg font-semibold text-foreground">
                No providers match your filters
              </p>
              <p className="mt-1 text-sm text-muted-foreground">Try adjusting or clearing your filters.</p>
              <Button variant="outline" className="mt-4" onClick={clearFilters}>
                Clear all filters
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {providers.map((provider) => (
                <ProviderCard key={provider.id} provider={provider} />
              ))}
            </div>
          )}
        </div>
      </div>
    </Container>
  );
}

export function ServiceBrowser() {
  const params = useSearchParams();
  const categoryParam = params.get("category");
  const initialCategory = (serviceCategories as string[]).includes(categoryParam ?? "")
    ? (categoryParam as ServiceCategory)
    : null;
  const initialQ = params.get("q") ?? "";

  return (
    <ServiceBrowserInner
      key={`${initialCategory ?? "all"}-${initialQ}`}
      initialCategory={initialCategory}
      initialQ={initialQ}
    />
  );
}
