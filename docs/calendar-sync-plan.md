# Plan — Cross-Channel Calendar Sync (iCal two-way)

> **STATUS (Aug 2026): Phases 0–4 + 6 BUILT.** Engine (`src/lib/ical.ts`, `calendar-sync-core.ts`,
> `/api/cron/sync-calendars`, `/api/calendar/sync-now`, `/api/listings/[id]/calendar.ics`), schema
> (`supabase/calendar-sync.sql`), host UI (`properties/[id]` panel), and docs are done. Implementation
> note: used a dependency-free iCal parser instead of `node-ical`. **To activate:** run
> `calendar-sync.sql`, set `CRON_SECRET` (+ service-role key), deploy, and add the cron job
> (Phase 5 — see `DEPLOY-HOSTINGER.md` §5). Scope: stays, whole-unit.


## Goal
Stop the same night being sold twice when a host lists the same stay on **Booking.com**
(or Airbnb/VRBO) **and** GH Bucketlist. When a date is taken on either side, it shows as
**unavailable** on the other — greyed/disabled in the guest calendar, and rejected at booking time.

Phase 1 targets **stays** (`kind = 'stay'`), the only vertical Booking.com covers. Cars/experiences
can reuse the same machinery later.

## Why this is a small feature here
The hard part — a database that enforces no-double-booking — already exists:
- `public.blocked_dates (listing_id, unit_key, start_date, end_date, reason)` — a block makes a
  unit unavailable for a half-open `[start, end)` range.
- `public.listing_booked_ranges` view unions active bookings + blocks (no PII) and is what the
  client calendar reads (`useListingBookedRanges` in `src/lib/db-availability.ts`;
  `dbUnitBlockedRanges` already disables blocked days in the picker).
- `public.create_booking()` already rejects any range overlapping a block.
- `src/lib/supabase/service.ts` → `createServiceClient()` (service role, server-only) and the
  secured API-route pattern (`src/app/api/notify/*`, `paystack/verify`) are in place.

**So the entire feature is: make an external reservation become a row in `blocked_dates`, and
publish our own bookings/blocks as an iCal feed.** No change to booking or calendar logic.

## Mechanism: iCal (.ics), both directions
iCal is the free, universal format every OTA imports/exports. To actually prevent double-booking
we need **both**:

1. **Import (Booking.com → Bucketlist).** Host pastes their Booking.com *Export Calendar* `.ics`
   URL into the listing. A scheduled worker fetches it, parses each `VEVENT` (a reservation =
   `DTSTART`/`DTEND`), and writes those ranges into `blocked_dates` tagged `source='ical'`.
2. **Export (Bucketlist → Booking.com).** We serve a per-listing `.ics` feed of our
   bookings + blocks. Host pastes that URL into Booking.com's *Import Calendar*.

### Known limitation — sync lag
iCal is **polled, not pushed**. OTAs refresh imported calendars every few hours; we poll theirs
on an interval. A short overbooking window between syncs is inherent to iCal across the whole
industry. Mitigate by polling every 15–30 min. A real-time fix means the Booking.com Connectivity
API or a channel manager (Beds24/Hostaway/Channex) — out of scope for Phase 1, layered later.

---

## Phase 0 — Deps + env
- Add **`node-ical`** to `package.json` (robust VEVENT/all-day/timezone parsing; server-only).
- New env (server-only; add to `.env.local` + Hostinger):
  - `CRON_SECRET` — bearer secret the cron caller sends so the sync route can't be triggered by
    the public.
  - Reuse existing `SUPABASE_SERVICE_ROLE_KEY` (already added for email) and
    `NEXT_PUBLIC_SITE_URL`/domain for building absolute export URLs.

## Phase 1 — Schema (`supabase/calendar-sync.sql`, same conventions: `if not exists` / `create or replace` / `drop policy if exists`)

**a. `calendar_feeds`** — external URLs a host connects (import side):
```sql
create table if not exists public.calendar_feeds (
  id uuid primary key default gen_random_uuid(),
  listing_id text not null references public.listings(id) on delete cascade,
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
```
RLS: readable + writable only by the listing owner (`created_by`), mirroring the `blocked_dates`
"Owners manage blocks" policy. The worker uses the service client, which bypasses RLS.

**b. Tag blocks with their origin** so a re-sync only touches synced rows and never wipes a host's
own maintenance blocks:
```sql
alter table public.blocked_dates
  add column if not exists source  text not null default 'host',   -- 'host' | 'ical'
  add column if not exists feed_id uuid references public.calendar_feeds(id) on delete cascade,
  add column if not exists external_uid text;                       -- VEVENT UID
create index if not exists blocked_feed_idx on public.blocked_dates (feed_id);
```
- Optional hardening: change the owner policy's `with check` to `source = 'host'` so hosts can only
  hand-manage their own blocks, never the synced ones (avoids confusion; synced rows are worker-owned).
- The `listing_booked_ranges` view needs **no change** — synced blocks are still `source='block'`
  to the client, so they disable calendar days exactly like host blocks today.

## Phase 2 — Import worker (secured cron route) `src/app/api/cron/sync-calendars/route.ts`
- `POST`, guarded by `Authorization: Bearer ${CRON_SECRET}`; returns 401 otherwise.
- Uses `createServiceClient()`. For each active feed:
  1. `fetch(url)` the `.ics` (timeout + try/catch per feed so one bad feed doesn't stop the rest).
  2. Parse with `node-ical`; keep `VEVENT`s with a valid `start`/`end`; normalize all-day dates to
     `YYYY-MM-DD`, treat `end` as the exclusive half-open boundary (matches our range convention).
  3. **Full refresh per feed** (simplest + self-healing for OTA cancellations): in effect,
     delete `blocked_dates where feed_id = :id` then insert the current events
     (`source='ical'`, `feed_id`, `external_uid=VEVENT.uid`, `reason='Synced from '||source`).
     Do it as delete-then-insert; a small race is harmless because `create_booking` re-checks live.
  4. Update `last_synced_at` / `last_status` / `last_error` / `last_event_count`.
- Response: per-feed summary `{ feedId, ok, events, error }` (no PII).
- Also expose a **"Sync now"** path (owner-authenticated, cookie client → verify ownership → call
  the same core with the service client) so a host can force a refresh from the UI.

## Phase 3 — Export feed `src/app/api/listings/[id]/calendar.ics/route.ts`
- `GET`, returns `Content-Type: text/calendar`. Public but **no PII** — only date ranges.
- Build `VEVENт`s from `listing_booked_ranges` for that listing (active bookings + all blocks),
  `SUMMARY:Unavailable`, stable `UID` per row (e.g. `b/ block-<id>@ghbucketlist.com`),
  `DTSTART;VALUE=DATE` / `DTEND;VALUE=DATE`.
- Exporting *all* blocks (including `ical`-sourced) is intentional: it lets an Airbnb reservation
  reach Booking.com through us. Echoing a block back to its origin OTA is redundant but harmless
  (same dates already blocked there). Per-unit variant: `?unit=<roomTypeId>` for hotels.

## Phase 4 — Host UI — per-listing "Calendar Sync" panel
There is currently no per-property manage page (only `/dashboard/host/properties` list + `/new`).
Add `src/app/dashboard/host/properties/[id]/page.tsx` (or a "Sync" tab there) with:
- **Import:** add/remove feed URLs (source dropdown + URL), each showing `last_synced_at`, status,
  event count, and a **Sync now** button. Inline help: where to find Booking.com's Export URL.
- **Export:** the listing's Bucketlist `.ics` URL with a copy button + "paste this into Booking.com's
  Import Calendar" instructions.
- Hotels (room types): a feed/URL per `unit_key`.
- New lib `src/lib/calendar-sync.ts` (client hooks: list/add/remove feeds, trigger sync) alongside
  the existing db-* hooks.

## Phase 5 — Scheduling on Hostinger
- hPanel → **Cron Jobs**: every 20 min, `curl -fsS -X POST -H "Authorization: Bearer $CRON_SECRET"
  https://ghbucketlist.com/api/cron/sync-calendars`.
- Alternative (if cron on the plan is limited): Supabase `pg_cron` + `pg_net` calling the same route,
  or an external pinger (cron-job.org). Document the primary (Hostinger cron) in `DEPLOY-HOSTINGER.md`
  along with `CRON_SECRET`.

## Phase 6 — Docs + polish
- `DEPLOY-HOSTINGER.md`: `CRON_SECRET`, the cron entry, and a short "Connect Booking.com" host guide.
- Host view labels synced blocks "Synced from Booking.com"; guests see only "unavailable".

---

## Data-flow summary
```
Booking.com reservation
   └─(export .ics)→ our cron worker ─→ blocked_dates(source='ical', feed_id)
                                          └─→ listing_booked_ranges ─→ guest calendar greys the day
                                          └─→ create_booking() rejects overlaps
Bucketlist booking / block
   └─→ /api/listings/[id]/calendar.ics ─(host pastes into Booking.com Import)→ blocked there
```

## Edge cases & risks
- **Overbooking window** between polls — inherent to iCal (see limitation above); mitigate with a
  20-min cadence; optionally add a booking lead-time buffer on hot listings later.
- **Bad/expired feed URL** — per-feed try/catch; surface `last_error` in the UI; never fail the whole run.
- **Feedback echo** — exporting imported blocks back to their origin is redundant, not harmful.
- **PII** — export reads the no-PII view; summaries are generic "Unavailable".
- **Host deletes a synced block** — next sync restores it (or lock via `source='host'` check).
- **Timezones / all-day** — Booking.com emits all-day `VALUE=DATE`; normalize consistently to our
  half-open date ranges. `node-ical` handles the parsing.
- **Idempotency** — full delete-replace per feed means re-runs converge; OTA cancellations drop off
  automatically.
- **Security** — cron route requires `CRON_SECRET`; all writes go through the service client on the
  server only; feed management is owner-gated by RLS.

## Verification
1. Create a stay; add a Booking.com (or a hand-made `.ics`) feed URL; run **Sync now** →
   `blocked_dates` gains `source='ical'` rows; the guest calendar disables those days;
   `create_booking` on an overlapping range raises "Those dates are unavailable."
2. Book a night on Bucketlist → GET the export `.ics` → the range appears as an "Unavailable" VEVENT
   with no guest data.
3. Remove/deactivate the feed → next sync clears its `ical` blocks; host blocks remain untouched.
4. Bad URL → `last_status='error'`, `last_error` shown, other feeds still sync.
5. `npx tsc --noEmit` clean; production `next build` compiles the new routes.

## Rollout order
Phase 1 (schema) → Phase 2 (import worker + Sync now) → Phase 3 (export route) → Phase 4 (host UI)
→ Phase 5 (cron) → Phase 6 (docs). Phases 2–3 are independently testable before any UI exists.
```
