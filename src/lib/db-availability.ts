"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { rangesOverlap } from "@/lib/availability";

// Reads real availability from the database: the listing_booked_ranges view unions active
// bookings and host blocks (no personal data). Availability is derived here, so once anyone
// books a slot it's reflected for everyone — the shared, multi-device guarantee.

export type ListingKind = "stay" | "car" | "experience" | "service";

export type BookedRange = {
  unitKey: string;
  start: string; // ISO YYYY-MM-DD
  end: string; // exclusive
  units: number | null; // null for blocks (block the whole unit)
  source: "booking" | "block";
};

type Row = {
  unit_key: string;
  start_date: string;
  end_date: string;
  units: number | null;
  source: string;
};

/** Fetch the booked/blocked ranges for one listing. Empty while loading or on error. */
export function useListingBookedRanges(listingId: string | undefined) {
  // Keyed by the id we fetched, so a stale response is ignored and loading derives cleanly
  // (no synchronous setState in the effect).
  const [fetched, setFetched] = useState<{ id: string; ranges: BookedRange[] } | null>(null);

  useEffect(() => {
    if (!listingId) return;
    let active = true;
    const supabase = createClient();
    supabase
      .from("listing_booked_ranges")
      .select("unit_key,start_date,end_date,units,source")
      .eq("listing_id", listingId)
      .then(({ data }) => {
        if (!active) return;
        setFetched({
          id: listingId,
          ranges: ((data ?? []) as Row[]).map((r) => ({
            unitKey: r.unit_key,
            start: r.start_date,
            end: r.end_date,
            units: r.units,
            source: r.source === "block" ? "block" : "booking",
          })),
        });
      });
    return () => {
      active = false;
    };
  }, [listingId]);

  const ready = fetched?.id === listingId;
  return { ranges: ready ? fetched!.ranges : [], loading: !ready };
}

/** Rooms of a hotel room type still bookable for the range, from real DB data. */
export function dbRoomsLeft(
  unitKey: string,
  inventory: number,
  ranges: BookedRange[],
  startISO: string,
  endISO: string
) {
  const forUnit = ranges.filter((r) => r.unitKey === unitKey && rangesOverlap(startISO, endISO, r.start, r.end));
  if (forUnit.some((r) => r.source === "block")) return 0;
  const taken = forUnit.reduce((sum, r) => sum + (r.units ?? 0), 0);
  return Math.max(0, inventory - taken);
}

/** Whether a whole-unit listing (unit_key "") is free for the range. */
export function dbUnitAvailable(ranges: BookedRange[], startISO: string, endISO: string) {
  return !ranges.some((r) => r.unitKey === "" && rangesOverlap(startISO, endISO, r.start, r.end));
}

/** Every blocking range for a whole-unit listing, for disabling calendar days. */
export function dbUnitBlockedRanges(ranges: BookedRange[]) {
  return ranges.filter((r) => r.unitKey === "").map((r) => ({ start: r.start, end: r.end }));
}
