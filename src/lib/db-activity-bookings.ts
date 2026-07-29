"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getExperienceCategory, getExperienceHost } from "@/lib/repository";
import type { StoredBooking, BookingStatus } from "@/lib/bookings-store";
import type { Experience } from "@/lib/types";

// The signed-in user's activity bookings, read from the DB and shaped like the local store's
// records so the existing dashboard cards render unchanged. RLS returns only the user's own rows.

type Row = {
  reference: string;
  listing_id: string;
  start_date: string;
  units: number;
  total: number;
  status: string;
  details: { ticketTypeName?: string } | null;
  created_at: string;
  listings: { data: Experience } | null;
};

function toStatus(s: string): BookingStatus {
  if (s === "completed") return "attended";
  if (s === "cancelled" || s === "declined") return "cancelled";
  return "confirmed";
}

function toStored(row: Row): StoredBooking | null {
  const e = row.listings?.data;
  if (!e) return null;
  return {
    reference: row.reference,
    experienceId: row.listing_id,
    experienceSlug: e.slug,
    experienceTitle: e.title,
    experienceImage: e.images[0],
    hostName: getExperienceHost(e)?.name ?? "",
    venueName: e.venueName,
    neighbourhood: e.neighbourhood,
    categoryName: getExperienceCategory(e)?.name ?? "",
    dateISO: new Date(row.start_date).toISOString(),
    scheduleTime: e.scheduleTime,
    durationMinutes: e.durationMinutes,
    ticketTypeName: row.details?.ticketTypeName ?? "",
    quantity: row.units,
    total: row.total,
    gpEarned: 0,
    gpRedeemed: 0,
    discountApplied: 0,
    isGift: false,
    status: toStatus(row.status),
    createdAtISO: row.created_at,
  };
}

/** The signed-in user's activity bookings from the DB. Empty while loading or when signed out. */
export function useDbActivityBookings(): StoredBooking[] {
  const [bookings, setBookings] = useState<StoredBooking[]>([]);
  useEffect(() => {
    let active = true;
    createClient()
      .from("bookings")
      .select("reference,listing_id,start_date,units,total,status,details,created_at,listings(data)")
      .eq("kind", "experience")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (!active) return;
        setBookings(((data ?? []) as unknown as Row[]).map(toStored).filter((b): b is StoredBooking => b !== null));
      });
    return () => {
      active = false;
    };
  }, []);
  return bookings;
}
