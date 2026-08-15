-- GH Bucketlist — CALENDAR SYNC (iCal two-way, stays)
-- Run once in the Supabase SQL Editor AFTER marketplace.sql. Safe to re-run.
--
-- Lets a host connect their Booking.com/Airbnb calendar export URL to a listing. A background worker
-- fetches each feed and writes the reserved dates into blocked_dates (tagged source='ical'), so they
-- show unavailable on GH Bucketlist. We also publish a per-listing .ics feed the host imports back
-- into Booking.com. No change to booking/availability logic — synced rows are just blocked_dates.

-- ---------------------------------------------------------------------------
-- 1. calendar_feeds — the external calendar URLs a host connects.
-- ---------------------------------------------------------------------------
create table if not exists public.calendar_feeds (
  id uuid primary key default gen_random_uuid(),
  listing_id text not null references public.listings (id) on delete cascade,
  unit_key text not null default '',        -- room-type id for hotels; '' for whole-unit stays
  source text not null,                     -- 'booking.com' | 'airbnb' | 'vrbo' | 'other'
  url text not null,
  is_active boolean not null default true,
  last_synced_at timestamptz,
  last_status text,                         -- 'ok' | 'error'
  last_error text,
  last_event_count int,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (listing_id, unit_key, url)
);

create index if not exists calendar_feeds_listing_idx on public.calendar_feeds (listing_id);

alter table public.calendar_feeds enable row level security;

-- The listing owner manages their own feeds. The sync worker uses the service role (bypasses RLS).
drop policy if exists "Owners manage calendar feeds" on public.calendar_feeds;
create policy "Owners manage calendar feeds" on public.calendar_feeds
  for all to authenticated
  using (auth.uid() = (select l.created_by from public.listings l where l.id = listing_id))
  with check (auth.uid() = (select l.created_by from public.listings l where l.id = listing_id));

-- ---------------------------------------------------------------------------
-- 2. Tag blocked_dates with their origin, so a re-sync only replaces synced rows and never touches
--    a host's own manual/maintenance blocks. The listing_booked_ranges view needs no change —
--    synced rows are still source='block' to the client and disable calendar days like any block.
-- ---------------------------------------------------------------------------
alter table public.blocked_dates
  add column if not exists source text not null default 'host',   -- 'host' | 'ical'
  add column if not exists feed_id uuid references public.calendar_feeds (id) on delete cascade,
  add column if not exists external_uid text;                      -- VEVENT UID from the source feed

create index if not exists blocked_feed_idx on public.blocked_dates (feed_id);
