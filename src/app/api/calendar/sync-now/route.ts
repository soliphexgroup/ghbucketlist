import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { syncFeed, type Feed } from "@/lib/calendar-sync-core";

// Host presses "Sync now" for one feed. Authorization is via RLS: the cookie client can only read a
// calendar_feeds row the caller owns (Owners-manage policy), so if the row resolves, they own it.
export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const feedId = typeof body?.feedId === "string" ? body.feedId : "";
  if (!feedId) return NextResponse.json({ ok: false, message: "Missing feedId" }, { status: 400 });

  const supabase = await createClient();
  const { data: owned } = await supabase
    .from("calendar_feeds")
    .select("id,listing_id,unit_key,source,url")
    .eq("id", feedId)
    .maybeSingle();
  if (!owned) return NextResponse.json({ ok: false, message: "Not found" }, { status: 404 }); // not the caller's feed (RLS)

  const svc = createServiceClient();
  if (!svc) return NextResponse.json({ ok: false, message: "Not configured" }, { status: 500 });

  const result = await syncFeed(svc, owned as unknown as Feed);
  return NextResponse.json({ ok: result.ok, result });
}
