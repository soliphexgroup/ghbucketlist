"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Search } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { GuestsRoomsEditor, type GuestCounts } from "@/components/home/search-widget";
import {
  MobileDateField,
  MobileSearchShell,
  MobileSearchSubmit,
  addDays,
  startOfToday,
} from "@/components/home/mobile-search-fields";
import { parseDateParam } from "@/lib/dates";
import { listPropertyNeighbourhoods } from "@/lib/stay-repository";
import { cn } from "@/lib/utils";

export type StaySearchInitial = {
  q?: string;
  checkIn?: Date;
  checkOut?: Date;
  guests?: GuestCounts;
};

/**
 * Reads a stay search back out of the URL, so any surface that reopens the box
 * (the listing, the sticky bar) shows what's actually on screen.
 */
export function readStaySearch(params: URLSearchParams) {
  const adults = Number(params.get("adults")) || 0;
  const children = Number(params.get("children")) || 0;
  const rooms = Number(params.get("rooms")) || 0;
  const hasGuestCounts = params.has("adults") || params.has("children") || params.has("rooms");

  return {
    initial: {
      q: params.get("q") ?? "",
      checkIn: parseDateParam(params.get("checkin")),
      checkOut: parseDateParam(params.get("checkout")),
      guests: hasGuestCounts
        ? { adults, children, rooms, pets: params.get("pets") === "1" }
        : undefined,
    } satisfies StaySearchInitial,
    // Every property-type tile lands here with a type (or sort, for Getaways).
    carryParams: { type: params.get("type"), sort: params.get("sort") },
  };
}

export function MobileStaySearch({
  initial,
  carryParams,
  onSearch,
}: {
  /** Pre-fills the box from an existing search, so it reflects the results on screen. */
  initial?: StaySearchInitial;
  /** Drill-down context (property type / sort) to preserve across a search. */
  carryParams?: Record<string, string | null>;
  /** Takes over from the default "go to the listing" — used where a search edits the page it's on. */
  onSearch?: (params: URLSearchParams) => void;
} = {}) {
  const router = useRouter();
  const neighbourhoods = listPropertyNeighbourhoods();

  const [location, setLocation] = useState(initial?.q ?? "");
  const [locationOpen, setLocationOpen] = useState(false);
  const [checkIn, setCheckIn] = useState<Date | undefined>(initial?.checkIn ?? addDays(new Date(), 7));
  const [checkOut, setCheckOut] = useState<Date | undefined>(initial?.checkOut ?? addDays(new Date(), 9));
  const [guests, setGuests] = useState<GuestCounts>(
    initial?.guests ?? { adults: 2, children: 0, rooms: 1, pets: false }
  );
  const [guestsOpen, setGuestsOpen] = useState(false);

  function handleCheckInSelect(next: Date | undefined) {
    setCheckIn(next);
    // Keep the stay valid: check-out must stay at least one night after check-in.
    if (next && checkOut && checkOut <= next) setCheckOut(addDays(next, 1));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (location.trim()) params.set("q", location.trim());
    if (checkIn) params.set("checkin", checkIn.toISOString().slice(0, 10));
    if (checkOut) params.set("checkout", checkOut.toISOString().slice(0, 10));
    // Kept separate (rather than one total) so the booking widget can restore them.
    if (guests.adults > 0) params.set("adults", String(guests.adults));
    if (guests.children > 0) params.set("children", String(guests.children));
    if (guests.rooms > 0) params.set("rooms", String(guests.rooms));
    if (guests.pets) params.set("pets", "1");
    // Keep the drill-down context (e.g. type=hotel) so searching stays within it.
    for (const [key, value] of Object.entries(carryParams ?? {})) {
      if (value) params.set(key, value);
    }
    if (onSearch) {
      onSearch(params);
      return;
    }
    router.push(`/stay${params.toString() ? `?${params.toString()}` : ""}`);
  }

  return (
    <MobileSearchShell onSubmit={handleSubmit}>
      {/* Location */}
      <Popover open={locationOpen} onOpenChange={setLocationOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="flex w-full items-center gap-3 rounded-md bg-white px-4 py-4 text-left"
          >
            <Search className="size-5 shrink-0 text-muted-foreground" />
            <span className="truncate text-base font-bold text-foreground">
              {location || "Around current location"}
            </span>
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-2" align="start">
          <p className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
            Neighbourhoods with places to stay
          </p>
          <div className="flex max-h-72 flex-col overflow-y-auto">
            {neighbourhoods.map((n) => {
              const isSelected = n === location;
              return (
                <button
                  key={n}
                  type="button"
                  onClick={() => {
                    setLocation(n);
                    setLocationOpen(false);
                  }}
                  className={cn(
                    "flex items-center justify-between rounded-md px-2 py-2 text-left text-sm hover:bg-muted",
                    isSelected ? "bg-accent font-medium text-primary" : "text-foreground"
                  )}
                >
                  {n}
                  {isSelected && <Check className="size-4 shrink-0" />}
                </button>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>

      {/* Check-in / Check-out */}
      <div className="grid grid-cols-2 gap-1.5">
        <MobileDateField
          label="Check-in date"
          date={checkIn}
          onSelect={handleCheckInSelect}
          disabled={(d) => d < startOfToday()}
        />
        <MobileDateField
          label="Check-out date"
          date={checkOut}
          onSelect={setCheckOut}
          disabled={(d) => d <= (checkIn ?? startOfToday())}
        />
      </div>

      {/* Adults / Children / Rooms */}
      <Popover open={guestsOpen} onOpenChange={setGuestsOpen}>
        <PopoverTrigger asChild>
          <button type="button" className="grid w-full grid-cols-3 rounded-md bg-white text-left">
            {(
              [
                { label: "Adults", value: guests.adults },
                { label: "Children", value: guests.children },
                { label: "Rooms", value: guests.rooms },
              ] as const
            ).map((field, i) => (
              <span
                key={field.label}
                className={cn("flex flex-col gap-1 px-4 py-3", i > 0 && "border-l border-border")}
              >
                <span className="text-sm text-muted-foreground">{field.label}</span>
                <span className="text-base font-bold text-foreground">{field.value}</span>
              </span>
            ))}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-5" align="start">
          {guestsOpen && (
            <GuestsRoomsEditor
              key={`${guests.adults}-${guests.children}-${guests.rooms}-${guests.pets}`}
              initial={guests}
              onDone={(next) => {
                setGuests(next);
                setGuestsOpen(false);
              }}
            />
          )}
        </PopoverContent>
      </Popover>

      <MobileSearchSubmit />
    </MobileSearchShell>
  );
}
