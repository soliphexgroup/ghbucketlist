"use client";

import { createClient } from "@/lib/supabase/client";
import type { ListingKind } from "@/lib/db-availability";

export type CreateBookingInput = {
  reference: string;
  kind: ListingKind;
  listingId: string;
  /** Room-type id for hotels; "" for whole-unit stays, cars, activities, services. */
  unitKey?: string;
  /** ISO YYYY-MM-DD, half-open [start, end). Single-day kinds pass end = start + 1 day. */
  start: string;
  end: string;
  units?: number;
  guests?: number;
  total: number;
  guestName?: string;
  guestEmail?: string;
  details?: unknown;
};

export type CreateBookingResult =
  | { ok: true; reference: string }
  | { ok: false; reason: "signin" | "unavailable" | "error"; message: string };

/**
 * Create a booking through the create_booking RPC, which atomically re-checks availability in
 * the database. Requires a signed-in user (bookings are owned by auth.uid()).
 */
export async function createDbBooking(input: CreateBookingInput): Promise<CreateBookingResult> {
  const supabase = createClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    return { ok: false, reason: "signin", message: "Please sign in to complete your booking." };
  }

  const { error } = await supabase.rpc("create_booking", {
    p_reference: input.reference,
    p_kind: input.kind,
    p_listing_id: input.listingId,
    p_unit_key: input.unitKey ?? "",
    p_start: input.start,
    p_end: input.end,
    p_units: input.units ?? 1,
    p_guests: input.guests ?? 1,
    p_total: input.total,
    p_guest_name: input.guestName ?? session.user.email ?? null,
    p_guest_email: input.guestEmail ?? session.user.email ?? null,
    p_details: input.details ?? null,
  });

  if (error) {
    // Postgres 28000 is our "must be signed in" guard; availability failures come back as text.
    if (error.code === "28000") return { ok: false, reason: "signin", message: error.message };
    if (/availab|unavailable|not enough/i.test(error.message)) {
      return { ok: false, reason: "unavailable", message: error.message };
    }
    return { ok: false, reason: "error", message: error.message };
  }

  return { ok: true, reference: input.reference };
}
