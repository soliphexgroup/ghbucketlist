-- GH Bucketlist — MARKETPLACE SCHEMA (Option B: real listings + bookings + availability)
-- Run this once in the Supabase SQL Editor AFTER migration.sql (auth + storage).
-- Safe to re-run: uses "if not exists" / "create or replace" / "drop policy if exists" throughout.
--
-- Design: listings are stored as one row each with a JSONB `data` column matching the app's
-- TypeScript shapes (rich nested fields — room types, ticket types, amenities…), plus a few
-- normalized columns for filtering. Bookings, blocks and availability are normalized so the
-- database can genuinely enforce no-double-booking across users and devices.

-- ---------------------------------------------------------------------------
-- 1. Listings ---------------------------------------------------------------
-- ---------------------------------------------------------------------------
do $$ begin
  create type public.listing_kind as enum ('stay', 'car', 'experience', 'service');
exception when duplicate_object then null; end $$;

create table if not exists public.listings (
  id text primary key,                 -- keep the app's existing string ids, e.g. "prop-airport-suite"
  kind public.listing_kind not null,
  host_id text not null,               -- "host-…" for the seeded catalog, or the auth uid for host-created
  slug text not null,
  title text not null,
  city text,
  category text,                       -- propertyType / car category / experience categoryId / service category
  price_from numeric not null default 0,
  rating numeric not null default 0,
  is_active boolean not null default true,
  created_by uuid references auth.users (id) on delete set null,  -- null for the seeded catalog
  data jsonb not null,                 -- the full typed listing object
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (kind, slug)
);

create index if not exists listings_kind_idx on public.listings (kind);
create index if not exists listings_host_idx on public.listings (host_id);
create index if not exists listings_city_idx on public.listings (city);
create index if not exists listings_category_idx on public.listings (category);
create index if not exists listings_created_by_idx on public.listings (created_by);

alter table public.listings enable row level security;

-- Active listings are public; owners can also see their own inactive ones.
drop policy if exists "Listings are readable" on public.listings;
create policy "Listings are readable" on public.listings
  for select using (is_active or auth.uid() = created_by);

drop policy if exists "Users create own listings" on public.listings;
create policy "Users create own listings" on public.listings
  for insert to authenticated with check (auth.uid() = created_by);

drop policy if exists "Users update own listings" on public.listings;
create policy "Users update own listings" on public.listings
  for update to authenticated using (auth.uid() = created_by) with check (auth.uid() = created_by);

drop policy if exists "Users delete own listings" on public.listings;
create policy "Users delete own listings" on public.listings
  for delete to authenticated using (auth.uid() = created_by);

-- ---------------------------------------------------------------------------
-- 2. Bookings ---------------------------------------------------------------
-- Every booking is a half-open date range [start_date, end_date): the end day is the day the
-- guest leaves / not an occupied night. Single-day kinds (experience, service) store a 1-day
-- range so overlap maths is uniform across kinds.
-- ---------------------------------------------------------------------------
do $$ begin
  create type public.booking_status as enum ('pending', 'confirmed', 'completed', 'cancelled', 'declined');
exception when duplicate_object then null; end $$;

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  kind public.listing_kind not null,
  listing_id text not null references public.listings (id) on delete cascade,
  unit_key text not null default '',   -- room-type id for hotels; '' for whole-unit stays, cars, activities, services
  user_id uuid not null references auth.users (id) on delete cascade,
  guest_name text,
  guest_email text,
  start_date date not null,
  end_date date not null,
  units int not null default 1,        -- rooms booked / seats taken / 1
  guests int not null default 1,
  total numeric not null default 0,
  status public.booking_status not null default 'confirmed',
  details jsonb,                       -- kind-specific extras (room selections, with-driver, tickets…)
  created_at timestamptz not null default now(),
  constraint bookings_valid_span check (end_date > start_date)
);

create index if not exists bookings_listing_idx on public.bookings (listing_id, unit_key);
create index if not exists bookings_user_idx on public.bookings (user_id);
create index if not exists bookings_status_idx on public.bookings (status);

alter table public.bookings enable row level security;

-- A guest sees their own bookings; a host sees bookings for listings they own.
drop policy if exists "Guests read own bookings" on public.bookings;
create policy "Guests read own bookings" on public.bookings
  for select using (
    auth.uid() = user_id
    or auth.uid() = (select l.created_by from public.listings l where l.id = listing_id)
  );

-- Inserts go through create_booking() (below), which validates availability. Direct inserts are
-- still limited to the signed-in user's own rows.
drop policy if exists "Guests create own bookings" on public.bookings;
create policy "Guests create own bookings" on public.bookings
  for insert to authenticated with check (auth.uid() = user_id);

-- Either side can update status (cancel / confirm / decline) on bookings they're party to.
drop policy if exists "Parties update bookings" on public.bookings;
create policy "Parties update bookings" on public.bookings
  for update to authenticated using (
    auth.uid() = user_id
    or auth.uid() = (select l.created_by from public.listings l where l.id = listing_id)
  );

-- ---------------------------------------------------------------------------
-- 3. Host/admin date blocks -------------------------------------------------
-- A blocked range makes a unit fully unavailable for those dates (e.g. maintenance, off-days).
-- ---------------------------------------------------------------------------
create table if not exists public.blocked_dates (
  id uuid primary key default gen_random_uuid(),
  listing_id text not null references public.listings (id) on delete cascade,
  unit_key text not null default '',
  start_date date not null,
  end_date date not null,
  reason text,
  created_at timestamptz not null default now(),
  constraint blocked_valid_span check (end_date > start_date)
);

create index if not exists blocked_listing_idx on public.blocked_dates (listing_id, unit_key);

alter table public.blocked_dates enable row level security;

-- Blocks are public (they affect availability everyone sees); only the listing owner manages them.
drop policy if exists "Blocks are readable" on public.blocked_dates;
create policy "Blocks are readable" on public.blocked_dates for select using (true);

drop policy if exists "Owners manage blocks" on public.blocked_dates;
create policy "Owners manage blocks" on public.blocked_dates
  for all to authenticated
  using (auth.uid() = (select l.created_by from public.listings l where l.id = listing_id))
  with check (auth.uid() = (select l.created_by from public.listings l where l.id = listing_id));

-- ---------------------------------------------------------------------------
-- 4. Availability reads -----------------------------------------------------
-- Booked + blocked ranges per unit, with NO personal data, so the client/calendar can compute
-- what's left. Bookings that still hold a slot are pending/confirmed/completed.
-- ---------------------------------------------------------------------------
create or replace view public.listing_booked_ranges as
  select listing_id, unit_key, start_date, end_date, units, 'booking'::text as source
  from public.bookings
  where status in ('pending', 'confirmed', 'completed')
  union all
  select listing_id, unit_key, start_date, end_date, null::int as units, 'block'::text as source
  from public.blocked_dates;

grant select on public.listing_booked_ranges to anon, authenticated;

-- The capacity (inventory) for a listing's unit, read from the listing's JSONB.
create or replace function public.unit_capacity(p_listing_id text, p_unit_key text)
returns int
language plpgsql
stable
as $$
declare
  l public.listings;
  cap int;
begin
  select * into l from public.listings where id = p_listing_id;
  if not found then return 0; end if;

  if l.kind = 'stay' and p_unit_key <> '' then
    -- hotel room type: inventory sits on the matching roomTypes entry
    select (rt->>'inventory')::int into cap
    from jsonb_array_elements(coalesce(l.data->'roomTypes', '[]'::jsonb)) rt
    where rt->>'id' = p_unit_key;
    return coalesce(cap, 0);
  elsif l.kind = 'experience' then
    return coalesce((l.data->>'maxCapacity')::int, 1);
  else
    -- whole-unit stay, car, service: a single bookable unit
    return 1;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 5. Atomic booking ---------------------------------------------------------
-- The real guarantee: a per-(listing, unit) advisory lock serializes concurrent attempts, then
-- we re-check capacity against overlapping active bookings and blocks before inserting. Two
-- devices cannot both take the last unit.
-- ---------------------------------------------------------------------------
create or replace function public.create_booking(
  p_reference text,
  p_kind public.listing_kind,
  p_listing_id text,
  p_unit_key text,
  p_start date,
  p_end date,
  p_units int,
  p_guests int,
  p_total numeric,
  p_guest_name text,
  p_guest_email text,
  p_details jsonb default null
)
returns public.bookings
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  capacity int;
  taken int;
  is_blocked boolean;
  result public.bookings;
begin
  if uid is null then
    raise exception 'You must be signed in to book.' using errcode = '28000';
  end if;
  if p_end <= p_start then
    raise exception 'Invalid date range.';
  end if;

  -- Serialize concurrent bookings of the same unit.
  perform pg_advisory_xact_lock(hashtext(p_listing_id || ':' || coalesce(p_unit_key, '')));

  capacity := public.unit_capacity(p_listing_id, coalesce(p_unit_key, ''));
  if capacity <= 0 then
    raise exception 'This listing is not bookable.';
  end if;

  select exists (
    select 1 from public.blocked_dates b
    where b.listing_id = p_listing_id
      and b.unit_key = coalesce(p_unit_key, '')
      and daterange(b.start_date, b.end_date, '[)') && daterange(p_start, p_end, '[)')
  ) into is_blocked;
  if is_blocked then
    raise exception 'Those dates are unavailable.';
  end if;

  select coalesce(sum(b.units), 0) into taken
  from public.bookings b
  where b.listing_id = p_listing_id
    and b.unit_key = coalesce(p_unit_key, '')
    and b.status in ('pending', 'confirmed', 'completed')
    and daterange(b.start_date, b.end_date, '[)') && daterange(p_start, p_end, '[)');

  if taken + p_units > capacity then
    raise exception 'Not enough availability for those dates.';
  end if;

  insert into public.bookings (
    reference, kind, listing_id, unit_key, user_id, guest_name, guest_email,
    start_date, end_date, units, guests, total, status, details
  ) values (
    p_reference, p_kind, p_listing_id, coalesce(p_unit_key, ''), uid, p_guest_name, p_guest_email,
    p_start, p_end, p_units, p_guests, p_total,
    (case when (p_details->>'requestOnly')::boolean then 'pending' else 'confirmed' end)::public.booking_status,
    p_details
  )
  returning * into result;

  return result;
end $$;

grant execute on function public.create_booking(
  text, public.listing_kind, text, text, date, date, int, int, numeric, text, text, jsonb
) to authenticated;
