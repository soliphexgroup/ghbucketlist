"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CalendarIcon, SlidersHorizontal, Users, X } from "lucide-react";
import { Container } from "@/components/container";
import { ActivityCard } from "@/components/activity-card";
import { FiltersSidebar, type FilterState } from "@/components/activities/filters-sidebar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { listExperiences, priceRangeBounds } from "@/lib/repository";
import { useHostCreatedExperiences } from "@/lib/host-experiences-store";
import type { ExperienceFilters } from "@/lib/repository";

/** "2026-07-17" → "Fri 17 Jul" */
function formatDateChip(iso: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return iso;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
    .toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })
    .replace(",", "");
}

function FilterChip({ icon: Icon, label, onClear }: {
  icon: typeof CalendarIcon;
  label: string;
  onClear: () => void;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
      <Icon className="size-3.5 shrink-0" />
      {label}
      <button
        type="button"
        onClick={onClear}
        aria-label={`Clear ${label}`}
        className="ml-0.5 rounded-full text-secondary-foreground/70 hover:text-secondary-foreground"
      >
        <X className="size-3" />
      </button>
    </span>
  );
}

const sortOptions: { value: NonNullable<ExperienceFilters["sort"]>; label: string }[] = [
  { value: "recommended", label: "Recommended" },
  { value: "price-asc", label: "Price (low to high)" },
  { value: "price-desc", label: "Price (high to low)" },
  { value: "newest", label: "Newest" },
  { value: "reviewed", label: "Most reviewed" },
];

function initialFilters(params: URLSearchParams): FilterState {
  const bounds = priceRangeBounds();
  const participants = Number(params.get("participants"));
  return {
    q: params.get("q") ?? "",
    categories: params.get("category") ? [params.get("category")!] : [],
    maxPrice: params.get("maxPrice") ? Number(params.get("maxPrice")) : bounds.max,
    duration: (params.get("duration") as FilterState["duration"]) ?? undefined,
    neighbourhood: params.get("neighbourhood") ?? undefined,
    minRating: params.get("minRating") ? Number(params.get("minRating")) : undefined,
    date: params.get("date") ?? undefined,
    participants: Number.isFinite(participants) && participants > 0 ? participants : undefined,
    sort: (params.get("sort") as FilterState["sort"]) ?? "recommended",
  };
}

export function ActivitiesBrowser({
  basePath = "/activities",
  title = "Activities",
  description = "Find the perfect activity for your interests",
}: {
  basePath?: string;
  title?: string;
  description?: string;
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const bounds = priceRangeBounds();
  const [filters, setFilters] = useState<FilterState>(() => initialFilters(searchParams));
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const hostCreated = useHostCreatedExperiences();
  const experiences = useMemo(() => listExperiences(filters, hostCreated), [filters, hostCreated]);

  function updateFilters(next: Partial<FilterState>) {
    const merged = { ...filters, ...next };
    setFilters(merged);

    const params = new URLSearchParams();
    if (merged.q) params.set("q", merged.q);
    if (merged.categories.length === 1) params.set("category", merged.categories[0]);
    if (merged.maxPrice !== bounds.max) params.set("maxPrice", String(merged.maxPrice));
    if (merged.duration) params.set("duration", merged.duration);
    if (merged.neighbourhood) params.set("neighbourhood", merged.neighbourhood);
    if (merged.minRating) params.set("minRating", String(merged.minRating));
    // Carried through so changing a sidebar filter doesn't discard the hero search.
    if (merged.date) params.set("date", merged.date);
    if (merged.participants) params.set("participants", String(merged.participants));
    if (merged.sort !== "recommended") params.set("sort", merged.sort);
    const query = params.toString();
    router.replace(query ? `${basePath}?${query}` : basePath, { scroll: false });
  }

  function clearFilters() {
    setFilters({ q: "", categories: [], maxPrice: bounds.max, sort: "recommended" });
    router.replace(basePath, { scroll: false });
  }

  return (
    <Container className="py-8 sm:py-10">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">
            {title}
          </h1>
          <p className="mt-1 text-muted-foreground">
            {description}
          </p>

          {(filters.date || filters.participants) && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {filters.date && (
                <FilterChip
                  icon={CalendarIcon}
                  label={formatDateChip(filters.date)}
                  onClear={() => updateFilters({ date: undefined })}
                />
              )}
              {filters.participants && (
                <FilterChip
                  icon={Users}
                  label={`${filters.participants} participant${filters.participants > 1 ? "s" : ""}`}
                  onClear={() => updateFilters({ participants: undefined })}
                />
              )}
            </div>
          )}
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
                <FiltersSidebar filters={filters} onChange={updateFilters} onClear={clearFilters} />
              </div>
            </SheetContent>
          </Sheet>

          <Select
            value={filters.sort}
            onValueChange={(value) => updateFilters({ sort: value as FilterState["sort"] })}
          >
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
          <FiltersSidebar filters={filters} onChange={updateFilters} onClear={clearFilters} />
        </aside>

        <div>
          <p className="mb-5 text-sm text-muted-foreground">
            Showing {experiences.length} experience{experiences.length === 1 ? "" : "s"}
          </p>

          {experiences.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-24 text-center">
              <p className="font-heading text-lg font-semibold text-foreground">
                No experiences match your filters
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Try adjusting or clearing your filters.
              </p>
              <Button variant="outline" className="mt-4" onClick={clearFilters}>
                Clear all filters
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:gap-6 xl:grid-cols-3">
              {experiences.map((experience) => (
                <ActivityCard key={experience.id} experience={experience} />
              ))}
            </div>
          )}
        </div>
      </div>
    </Container>
  );
}
