"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { WriteResult } from "@/lib/db-listings";

// Client data layer for the host "Calendar Sync" panel. Reads/writes calendar_feeds through the
// cookie client, which RLS scopes to the listing owner, and calls the sync-now API route.

export type CalendarFeed = {
  id: string;
  listingId: string;
  unitKey: string;
  source: string;
  url: string;
  isActive: boolean;
  lastSyncedAt: string | null;
  lastStatus: string | null;
  lastError: string | null;
  lastEventCount: number | null;
};

type Row = {
  id: string;
  listing_id: string;
  unit_key: string;
  source: string;
  url: string;
  is_active: boolean;
  last_synced_at: string | null;
  last_status: string | null;
  last_error: string | null;
  last_event_count: number | null;
};

function toFeed(r: Row): CalendarFeed {
  return {
    id: r.id,
    listingId: r.listing_id,
    unitKey: r.unit_key,
    source: r.source,
    url: r.url,
    isActive: r.is_active,
    lastSyncedAt: r.last_synced_at,
    lastStatus: r.last_status,
    lastError: r.last_error,
    lastEventCount: r.last_event_count,
  };
}

/** The calendar feeds connected to a listing (owner-scoped by RLS). `refresh()` re-fetches. */
export function useCalendarFeeds(listingId: string | undefined): {
  feeds: CalendarFeed[];
  loaded: boolean;
  refresh: () => void;
} {
  const [feeds, setFeeds] = useState<CalendarFeed[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!listingId) return;
    let active = true;
    createClient()
      .from("calendar_feeds")
      .select("id,listing_id,unit_key,source,url,is_active,last_synced_at,last_status,last_error,last_event_count")
      .eq("listing_id", listingId)
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        if (!active) return;
        setFeeds(((data ?? []) as Row[]).map(toFeed));
        setLoaded(true);
      });
    return () => {
      active = false;
    };
  }, [listingId, tick]);
  return { feeds, loaded, refresh: () => setTick((t) => t + 1) };
}

export async function addCalendarFeed(input: {
  listingId: string;
  unitKey?: string;
  source: string;
  url: string;
}): Promise<WriteResult> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return { ok: false, reason: "signin", message: "Please sign in." };
  const { error } = await supabase.from("calendar_feeds").insert({
    listing_id: input.listingId,
    unit_key: input.unitKey ?? "",
    source: input.source,
    url: input.url.trim(),
  });
  if (error) return { ok: false, reason: "error", message: error.message };
  return { ok: true };
}

export async function removeCalendarFeed(id: string): Promise<WriteResult> {
  const { error } = await createClient().from("calendar_feeds").delete().eq("id", id);
  if (error) return { ok: false, reason: "error", message: error.message };
  return { ok: true };
}

/** Trigger an immediate sync of one feed (owner-gated server route). */
export async function syncFeedNow(feedId: string): Promise<{ ok: boolean; message?: string; events?: number }> {
  try {
    const res = await fetch("/api/calendar/sync-now", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ feedId }),
    });
    const json = (await res.json().catch(() => null)) as
      | { ok?: boolean; message?: string; result?: { events?: number; error?: string } }
      | null;
    if (res.ok && json?.ok) return { ok: true, events: json.result?.events };
    return { ok: false, message: json?.result?.error || json?.message || "Sync failed." };
  } catch {
    return { ok: false, message: "Network error." };
  }
}

/** The public .ics URL a host pastes into Booking.com's Import Calendar. */
export function listingExportUrl(listingId: string, unitKey?: string): string {
  const origin = typeof window !== "undefined" ? window.location.origin : "https://ghbucketlist.com";
  const base = `${origin}/api/listings/${listingId}/calendar.ics`;
  return unitKey ? `${base}?unit=${encodeURIComponent(unitKey)}` : base;
}
