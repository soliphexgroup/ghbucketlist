"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { nightsBetween } from "@/lib/dates";
import { getPropertyHost } from "@/lib/stay-repository";
import type { StoredStayBooking, StayBookingStatus } from "@/lib/stay-bookings-store";
import type { Property } from "@/lib/stay-types";

// The signed-in user's stay bookings, read from the database and shaped like the local store's
// records so the existing dashboard cards render unchanged. RLS returns only the user's own rows.

type Row = {
  reference: string;
  listing_id: string;
  start_date: string;
  end_date: string;
  units: number;
  guests: number;
  total: number;
  status: string;
  created_at: string;
  listings: { data: Property } | null;
};

function toStatus(s: string): StayBookingStatus {
  if (s === "pending") return "pending_request";
  if (s === "confirmed" || s === "completed" || s === "cancelled" || s === "declined") return s;
  return "confirmed";
}

function toStored(row: Row): StoredStayBooking | null {
  const p = row.listings?.data;
  if (!p) return null;
  const checkIn = new Date(row.start_date);
  const checkOut = new Date(row.end_date);
  return {
    reference: row.reference,
    propertyId: row.listing_id,
    propertySlug: p.slug,
    propertyTitle: p.title,
    propertyImage: p.images[0],
    hostName: getPropertyHost(p)?.name ?? "",
    neighbourhood: p.neighbourhood,
    city: p.city,
    checkInISO: checkIn.toISOString(),
    checkOutISO: checkOut.toISOString(),
    nights: nightsBetween(checkIn, checkOut),
    guestsAdults: row.guests,
    guestsChildren: 0,
    rooms: row.units,
    nightlyRate: p.pricePerNight,
    cleaningFee: p.cleaningFee,
    total: row.total,
    bookingType: p.bookingType,
    status: toStatus(row.status),
    createdAtISO: row.created_at,
  };
}

/** The signed-in user's stay bookings from the DB. Empty while loading or when signed out. */
export function useDbStayBookings(): StoredStayBooking[] {
  const [bookings, setBookings] = useState<StoredStayBooking[]>([]);

  useEffect(() => {
    let active = true;
    const supabase = createClient();
    supabase
      .from("bookings")
      .select("reference,listing_id,start_date,end_date,units,guests,total,status,created_at,listings(data)")
      .eq("kind", "stay")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (!active) return;
        setBookings(((data ?? []) as unknown as Row[]).map(toStored).filter((b): b is StoredStayBooking => b !== null));
      });
    return () => {
      active = false;
    };
  }, []);

  return bookings;
}
