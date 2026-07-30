"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { WriteResult } from "@/lib/db-listings";
import type { ListingKind } from "@/lib/db-availability";

// Admin-only view of every booking across the platform. Admin RLS (is_admin()) lets these reads
// return all rows and lets an admin update any booking's status (confirm / decline a request, etc.).

export type BookingDbStatus = "pending" | "confirmed" | "completed" | "cancelled" | "declined";

export type AdminBooking = {
  reference: string;
  kind: ListingKind;
  listingId: string;
  listingTitle: string;
  guestName: string | null;
  guestEmail: string | null;
  startDate: string;
  endDate: string;
  units: number;
  total: number;
  status: BookingDbStatus;
  createdAt: string;
};

type Row = {
  reference: string;
  kind: string;
  listing_id: string;
  guest_name: string | null;
  guest_email: string | null;
  start_date: string;
  end_date: string;
  units: number;
  total: number;
  status: string;
  created_at: string;
  listings: { title: string } | null;
};

function toBooking(r: Row): AdminBooking {
  return {
    reference: r.reference,
    kind: r.kind as ListingKind,
    listingId: r.listing_id,
    listingTitle: r.listings?.title ?? "—",
    guestName: r.guest_name,
    guestEmail: r.guest_email,
    startDate: r.start_date,
    endDate: r.end_date,
    units: r.units,
    total: r.total,
    status: (r.status as BookingDbStatus) ?? "confirmed",
    createdAt: r.created_at,
  };
}

export async function setBookingStatus(reference: string, status: BookingDbStatus): Promise<WriteResult> {
  const supabase = createClient();
  const { error } = await supabase.from("bookings").update({ status }).eq("reference", reference);
  if (error) return { ok: false, reason: "error", message: error.message };
  return { ok: true };
}

/** Admin: every booking, newest first. `refresh()` re-fetches after a status change. */
export function useAdminBookings(): { bookings: AdminBooking[]; loaded: boolean; refresh: () => void } {
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let active = true;
    createClient()
      .from("bookings")
      .select("reference,kind,listing_id,guest_name,guest_email,start_date,end_date,units,total,status,created_at,listings(title)")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (!active) return;
        setBookings(((data ?? []) as unknown as Row[]).map(toBooking));
        setLoaded(true);
      });
    return () => {
      active = false;
    };
  }, [tick]);
  return { bookings, loaded, refresh: () => setTick((t) => t + 1) };
}
