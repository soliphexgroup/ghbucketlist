"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { daysBetween } from "@/lib/dates";
import { getCarVendor } from "@/lib/car-repository";
import type { StoredCarBooking, CarBookingStatus } from "@/lib/car-bookings-store";
import type { Car } from "@/lib/car-types";

// The signed-in user's car rentals, read from the DB and shaped like the local store's records
// so the existing dashboard cards render unchanged. RLS returns only the user's own rows.

type Row = {
  reference: string;
  listing_id: string;
  start_date: string;
  end_date: string;
  total: number;
  status: string;
  details: { withDriver?: boolean } | null;
  created_at: string;
  listings: { data: Car } | null;
};

function toStatus(s: string): CarBookingStatus {
  if (s === "pending") return "pending_request";
  if (s === "confirmed" || s === "completed" || s === "cancelled" || s === "declined") return s;
  return "confirmed";
}

function toStored(row: Row): StoredCarBooking | null {
  const c = row.listings?.data;
  if (!c) return null;
  const pickup = new Date(row.start_date);
  const ret = new Date(row.end_date);
  return {
    reference: row.reference,
    carId: row.listing_id,
    carSlug: c.slug,
    carTitle: `${c.make} ${c.model}`,
    carImage: c.images[0],
    vendorName: getCarVendor(c)?.name ?? "",
    pickupLocation: c.pickupLocation,
    city: c.city,
    pickupDateISO: pickup.toISOString(),
    returnDateISO: ret.toISOString(),
    days: daysBetween(pickup, ret),
    withDriver: Boolean(row.details?.withDriver),
    dailyRate: c.pricePerDay,
    total: row.total,
    bookingType: c.bookingType,
    status: toStatus(row.status),
    createdAtISO: row.created_at,
  };
}

/** The signed-in user's car rentals from the DB. Empty while loading or when signed out. */
export function useDbCarBookings(): StoredCarBooking[] {
  const [bookings, setBookings] = useState<StoredCarBooking[]>([]);
  useEffect(() => {
    let active = true;
    createClient()
      .from("bookings")
      .select("reference,listing_id,start_date,end_date,total,status,details,created_at,listings(data)")
      .eq("kind", "car")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (!active) return;
        setBookings(((data ?? []) as unknown as Row[]).map(toStored).filter((b): b is StoredCarBooking => b !== null));
      });
    return () => {
      active = false;
    };
  }, []);
  return bookings;
}
