"use client";

import { createClient } from "@/lib/supabase/client";
import type { ListingKind } from "@/lib/db-availability";

export type CreateBookingInput = {
  /** The per-row booking reference. */
  reference: string;
  /** The payment (Paystack) reference — a single payment can cover several rows (multi-room stay). */
  paymentReference: string;
  /** Request-to-book (pending, unpaid) vs instant (paid). Paid bookings require a verified payment. */
  requestOnly: boolean;
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
  | { ok: false; reason: "signin" | "unavailable" | "payment" | "error"; message: string };

/**
 * Create a booking through the server route /api/bookings/create, which authorizes the caller,
 * re-checks availability, and — for instant bookings — requires a verified Paystack payment that
 * covers the listing price. Booking creation is intentionally server-only now: the client can no
 * longer call create_booking directly.
 */
export async function createDbBooking(input: CreateBookingInput): Promise<CreateBookingResult> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    return { ok: false, reason: "signin", message: "Please sign in to complete your booking." };
  }

  try {
    const res = await fetch("/api/bookings/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        paymentReference: input.paymentReference,
        rowReference: input.reference,
        requestOnly: input.requestOnly,
        kind: input.kind,
        listingId: input.listingId,
        unitKey: input.unitKey ?? "",
        start: input.start,
        end: input.end,
        units: input.units ?? 1,
        guests: input.guests ?? 1,
        total: input.total,
        guestName: input.guestName ?? session.user.email ?? null,
        guestEmail: input.guestEmail ?? session.user.email ?? null,
        details: input.details ?? null,
      }),
    });
    const json = (await res.json().catch(() => null)) as
      | { ok?: boolean; reference?: string; reason?: string; message?: string }
      | null;

    if (res.ok && json?.ok) return { ok: true, reference: input.reference };
    const allowed = ["signin", "unavailable", "payment", "error"] as const;
    const reason = (allowed as readonly string[]).includes(json?.reason ?? "")
      ? (json!.reason as (typeof allowed)[number])
      : "error";
    return { ok: false, reason, message: json?.message || "Could not create the booking." };
  } catch {
    return { ok: false, reason: "error", message: "Network error creating the booking." };
  }
}
