import type { createServiceClient } from "@/lib/supabase/service";
import { parseIcsEvents } from "@/lib/ical";

// SERVER-ONLY sync engine. Fetches one external calendar feed, parses its reserved dates, and
// full-refreshes this feed's rows in blocked_dates (delete-then-insert, so cancellations on the OTA
// drop off automatically). Writes go through the service client, which bypasses RLS. Used by the
// cron worker (all active feeds) and the owner-triggered "Sync now" route (one feed).

export type Feed = { id: string; listing_id: string; unit_key: string; source: string; url: string };
export type SyncResult = { feedId: string; ok: boolean; events: number; error?: string };

type Svc = NonNullable<ReturnType<typeof createServiceClient>>;

export async function syncFeed(svc: Svc, feed: Feed): Promise<SyncResult> {
  try {
    const res = await fetch(feed.url, {
      signal: AbortSignal.timeout(15000),
      headers: { "User-Agent": "GHBucketlist-CalendarSync/1.0", Accept: "text/calendar,*/*" },
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`Fetch failed (HTTP ${res.status})`);

    const events = parseIcsEvents(await res.text()).filter((e) => e.start && e.end && e.end > e.start);

    // Full refresh: drop this feed's blocks, then insert the current set.
    await svc.from("blocked_dates").delete().eq("feed_id", feed.id);
    if (events.length > 0) {
      const rows = events.map((e, i) => ({
        listing_id: feed.listing_id,
        unit_key: feed.unit_key,
        start_date: e.start,
        end_date: e.end,
        source: "ical",
        feed_id: feed.id,
        external_uid: e.uid ?? `${feed.id}-${i}`,
        reason: `Synced from ${feed.source}`,
      }));
      const { error } = await svc.from("blocked_dates").insert(rows as never);
      if (error) throw new Error(error.message);
    }

    await svc
      .from("calendar_feeds")
      .update({
        last_synced_at: new Date().toISOString(),
        last_status: "ok",
        last_error: null,
        last_event_count: events.length,
        updated_at: new Date().toISOString(),
      } as never)
      .eq("id", feed.id);

    return { feedId: feed.id, ok: true, events: events.length };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Sync failed";
    await svc
      .from("calendar_feeds")
      .update({
        last_synced_at: new Date().toISOString(),
        last_status: "error",
        last_error: message,
        updated_at: new Date().toISOString(),
      } as never)
      .eq("id", feed.id);
    return { feedId: feed.id, ok: false, events: 0, error: message };
  }
}
