import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

// The ONLY path that creates a booking. Auths the caller from their session, then creates the row
// via the service role using create_paid_booking, which re-checks availability and — for instant
// (paid) bookings — requires a verified Paystack payment that covers a server-computed price floor.
// The client can no longer call create_booking directly (that grant is revoked in payment-gating.sql).

type Body = {
  paymentReference?: string;
  rowReference?: string;
  requestOnly?: boolean;
  kind?: string;
  listingId?: string;
  unitKey?: string;
  start?: string;
  end?: string;
  units?: number;
  guests?: number;
  total?: number;
  guestName?: string | null;
  guestEmail?: string | null;
  details?: unknown;
};

export async function POST(request: Request) {
  const b = (await request.json().catch(() => null)) as Body | null;
  if (!b || !b.rowReference || !b.paymentReference || !b.kind || !b.listingId || !b.start || !b.end) {
    return NextResponse.json({ ok: false, reason: "error", message: "Invalid booking request." }, { status: 400 });
  }

  // Identify the caller from their session cookie.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ ok: false, reason: "signin", message: "Please sign in to complete your booking." }, { status: 401 });
  }

  const svc = createServiceClient();
  if (!svc) {
    return NextResponse.json({ ok: false, reason: "error", message: "Booking is not configured on the server yet." }, { status: 500 });
  }

  // The service client is intentionally untyped (no generated Database types), so the RPC args cast.
  const { error } = await svc.rpc("create_paid_booking", {
    p_user_id: user.id,
    p_payment_reference: b.paymentReference,
    p_row_reference: b.rowReference,
    p_kind: b.kind,
    p_listing_id: b.listingId,
    p_unit_key: b.unitKey ?? "",
    p_start: b.start,
    p_end: b.end,
    p_units: b.units ?? 1,
    p_guests: b.guests ?? 1,
    p_total: b.total ?? 0,
    p_guest_name: b.guestName ?? user.email ?? null,
    p_guest_email: b.guestEmail ?? user.email ?? null,
    p_request_only: b.requestOnly ?? false,
    p_details: b.details ?? null,
  } as never);

  if (error) {
    const msg = error.message || "Could not create the booking.";
    if (/payment (not verified|does not cover)|below the listing price/i.test(msg)) {
      return NextResponse.json({ ok: false, reason: "payment", message: msg }, { status: 402 });
    }
    if (/availab|unavailable|not enough/i.test(msg)) {
      return NextResponse.json({ ok: false, reason: "unavailable", message: msg }, { status: 409 });
    }
    return NextResponse.json({ ok: false, reason: "error", message: msg }, { status: 400 });
  }

  return NextResponse.json({ ok: true, reference: b.rowReference });
}
