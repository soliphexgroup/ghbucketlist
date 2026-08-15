import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { syncFeed, type Feed } from "@/lib/calendar-sync-core";

// Scheduled worker: syncs every active calendar feed. Called by a cron job with the shared secret
// (Hostinger cron or Supabase pg_cron). Runs on the Node runtime (needs the service role + fetch).
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  const svc = createServiceClient();
  if (!svc) return NextResponse.json({ ok: false, message: "Not configured" }, { status: 500 });

  const { data } = await svc
    .from("calendar_feeds")
    .select("id,listing_id,unit_key,source,url")
    .eq("is_active", true);

  const feeds = (data ?? []) as Feed[];
  const results = [];
  for (const feed of feeds) results.push(await syncFeed(svc, feed)); // sequential: gentle on the OTAs

  return NextResponse.json({
    ok: true,
    feeds: results.length,
    synced: results.filter((r) => r.ok).length,
    results,
  });
}
