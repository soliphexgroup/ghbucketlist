"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { SlidersHorizontal } from "lucide-react";
import { Container } from "@/components/container";
import { PropertyCard } from "@/components/stay/property-card";
import { StayFiltersSidebar } from "@/components/stay/stay-filters-sidebar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { listProperties, propertyPriceBounds, type StayFilters } from "@/lib/stay-repository";
import { useHostCreatedProperties } from "@/lib/host-properties-store";
import { useStayBookings } from "@/lib/stay-bookings-store";
import type { PropertyType } from "@/lib/stay-types";

export type StayFilterState = Required<
  Pick<StayFilters, "q" | "propertyTypes" | "maxPrice" | "amenities" | "instantBookOnly" | "sort">
> & { guests: number; bedrooms: number; minRating?: number };

const sortOptions: { value: NonNullable<StayFilters["sort"]>; label: string }[] = [
  { value: "recommended", label: "Recommended" },
  { value: "price-asc", label: "Price (low to high)" },
  { value: "price-desc", label: "Price (high to low)" },
  { value: "rating", label: "Highest rated" },
];

function defaultFilters(): StayFilterState {
  return {
    q: "",
    propertyTypes: [] as PropertyType[],
    maxPrice: propertyPriceBounds().max,
    amenities: [],
    instantBookOnly: false,
    sort: "recommended",
    guests: 1,
    bedrooms: 0,
    minRating: undefined,
  };
}

function StayBrowserInner({
  initialType,
  initialSort,
  initialQ,
  initialGuests,
  checkIn,
  checkOut,
  bookingQuery,
}: {
  initialType: PropertyType | null;
  initialSort: StayFilterState["sort"] | null;
  initialQ: string;
  initialGuests: number;
  /** ISO search dates — when both are set, results are filtered to what's available. */
  checkIn?: string;
  checkOut?: string;
  /** The searched dates/guests, carried onto each card so the booking widget can restore them. */
  bookingQuery: string;
}) {
  const [filters, setFilters] = useState<StayFilterState>(() => ({
    ...defaultFilters(),
    propertyTypes: initialType ? [initialType] : [],
    sort: initialSort ?? "recommended",
    q: initialQ,
    guests: initialGuests,
  }));
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const hostCreated = useHostCreatedProperties();
  const bookings = useStayBookings();
  const properties = useMemo(
    () =>
      listProperties(
        {
          q: filters.q,
          propertyTypes: filters.propertyTypes,
          maxPrice: filters.maxPrice,
          bedrooms: filters.bedrooms || undefined,
          amenities: filters.amenities,
          instantBookOnly: filters.instantBookOnly,
          minRating: filters.minRating,
          guests: filters.guests > 1 ? filters.guests : undefined,
          checkIn,
          checkOut,
          sort: filters.sort,
        },
        hostCreated,
        bookings
      ),
    [filters, hostCreated, bookings, checkIn, checkOut]
  );

  function updateFilters(next: Partial<StayFilterState>) {
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
            Find your perfect place to stay
          </h1>
          <p className="mt-1 text-muted-foreground">
            Hotels, apartments, and vacation homes across Accra
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
                <StayFiltersSidebar filters={filters} onChange={updateFilters} onClear={clearFilters} />
              </div>
            </SheetContent>
          </Sheet>

          <Select value={filters.sort} onValueChange={(value) => updateFilters({ sort: value as StayFilterState["sort"] })}>
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
          <StayFiltersSidebar filters={filters} onChange={updateFilters} onClear={clearFilters} />
        </aside>

        <div>
          <p className="mb-5 text-sm text-muted-foreground">
            Showing {properties.length} propert{properties.length === 1 ? "y" : "ies"}
          </p>

          {properties.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-24 text-center">
              <p className="font-heading text-lg font-semibold text-foreground">
                No properties match your filters
              </p>
              <p className="mt-1 text-sm text-muted-foreground">Try adjusting or clearing your filters.</p>
              <Button variant="outline" className="mt-4" onClick={clearFilters}>
                Clear all filters
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:gap-6 xl:grid-cols-3">
              {properties.map((property) => (
                <PropertyCard key={property.id} property={property} bookingQuery={bookingQuery} />
              ))}
            </div>
          )}
        </div>
      </div>
    </Container>
  );
}

const validSorts = sortOptions.map((opt) => opt.value);

export function StayBrowser() {
  const params = useSearchParams();
  const initialType = params.get("type") as PropertyType | null;
  const sortParam = params.get("sort");
  const initialSort = validSorts.includes(sortParam as StayFilterState["sort"])
    ? (sortParam as StayFilterState["sort"])
    : null;
  const initialQ = params.get("q") ?? "";
  const adults = Number(params.get("adults")) || 0;
  const children = Number(params.get("children")) || 0;
  const totalGuests = adults + children;
  const initialGuests = totalGuests > 0 ? totalGuests : 1;

  // Only the booking-relevant criteria travel to the detail page.
  const bookingParams = new URLSearchParams();
  for (const key of ["checkin", "checkout", "adults", "children", "rooms", "pets"]) {
    const value = params.get(key);
    if (value) bookingParams.set(key, value);
  }
  const bookingQuery = bookingParams.toString();

  // Availability filtering needs both ends of the stay; a lone date isn't a range.
  const checkInParam = params.get("checkin") ?? undefined;
  const checkOutParam = params.get("checkout") ?? undefined;
  const checkIn = checkInParam && checkOutParam ? checkInParam : undefined;
  const checkOut = checkInParam && checkOutParam ? checkOutParam : undefined;

  return (
    <StayBrowserInner
      key={`${initialType ?? "all"}-${initialSort ?? "default"}-${initialQ}-${initialGuests}`}
      initialType={initialType}
      initialSort={initialSort}
      initialQ={initialQ}
      initialGuests={initialGuests}
      checkIn={checkIn}
      checkOut={checkOut}
      bookingQuery={bookingQuery}
    />
  );
}
