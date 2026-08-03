import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserEmail } from "@/lib/supabase/service";
import { sendEmail } from "@/lib/email/resend";
import { bookingConfirmationCustomer, newBookingHost } from "@/lib/email/templates";

type BookingRow = {
  reference: string;
  kind: string;
  listing_id: string;
  guest_name: string | null;
  guest_email: string | null;
  start_date: string;
  end_date: string;
  total: number;
  status: string;
  details: { requestOnly?: boolean } | null;
  listings: { title: string; created_by: string | null } | null;
};

// Emails the customer their confirmation, and (for real hosts) notifies the host of the booking.
// Ownership is enforced by RLS via the caller's session — the row only resolves if it's theirs.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const reference = typeof body?.reference === "string" ? body.reference : "";
  if (!reference) return NextResponse.json({ ok: true });

  const supabase = await createClient();
  const { data } = await supabase
    .from("bookings")
    .select(
      "reference,kind,listing_id,guest_name,guest_email,start_date,end_date,total,status,details,listings(title,created_by)"
    )
    .eq("reference", reference)
    .maybeSingle();

  const row = data as unknown as BookingRow | null;
  if (!row) return NextResponse.json({ ok: true }); // not the caller's booking (RLS) or missing

  const listingTitle = row.listings?.title ?? "your booking";
  const requestOnly = row.status === "pending" || row.details?.requestOnly === true;

  if (row.guest_email) {
    const t = bookingConfirmationCustomer({
      guestName: row.guest_name,
      listingTitle,
      reference: row.reference,
      startDate: row.start_date,
      endDate: row.end_date,
      total: row.total,
      requestOnly,
    });
    await sendEmail({ to: row.guest_email, subject: t.subject, html: t.html });
  }

  const hostEmail = await getUserEmail(row.listings?.created_by);
  if (hostEmail) {
    const t = newBookingHost({
      listingTitle,
      guestName: row.guest_name,
      reference: row.reference,
      startDate: row.start_date,
      endDate: row.end_date,
      total: row.total,
      requestOnly,
    });
    await sendEmail({ to: hostEmail, subject: t.subject, html: t.html });
  }

  return NextResponse.json({ ok: true });
}
