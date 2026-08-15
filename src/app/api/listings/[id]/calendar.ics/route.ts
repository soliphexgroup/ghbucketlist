import { createServiceClient } from "@/lib/supabase/service";
import { buildIcs } from "@/lib/ical";

// Public per-listing availability feed the host imports into Booking.com. NO PII — it's built from
// listing_booked_ranges (active bookings + blocks, dates only), every event just labelled
// "Unavailable". Optional ?unit=<roomTypeId> for a specific hotel room type.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Range = { unit_key: string; start_date: string; end_date: string };

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const unit = new URL(request.url).searchParams.get("unit") ?? "";

  const svc = createServiceClient();
  if (!svc) return new Response("Not configured", { status: 500 });

  const { data } = await svc
    .from("listing_booked_ranges")
    .select("unit_key,start_date,end_date")
    .eq("listing_id", id);

  const rows = ((data ?? []) as Range[]).filter((r) => (unit ? r.unit_key === unit : true));

  const events = rows.map((r) => ({
    // Stable UID per range so the importer dedupes across refreshes.
    uid: `ghb-${id}-${r.unit_key || "whole"}-${r.start_date}-${r.end_date}@ghbucketlist.com`,
    start: r.start_date,
    end: r.end_date,
  }));

  const ics = buildIcs({ name: "GHBucketlist availability", events });
  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `inline; filename="ghbucketlist-${id}.ics"`,
      "Cache-Control": "public, max-age=300",
    },
  });
}
