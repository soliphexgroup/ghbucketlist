-- GH Bucketlist — REVIEWS (real, verified, shared)
-- Run once in the Supabase SQL Editor AFTER marketplace.sql and admin.sql (needs is_admin()).
-- Safe to re-run: uses "if not exists" / "create or replace" / "drop policy if exists" throughout.
--
-- Reviews are verified: create_review() only lets a user review a listing they actually booked.
-- A listing's displayed rating is computed from visible reviews (listing_ratings view) — there is
-- no fabricated rating; unreviewed listings simply have no rating yet.

-- ---------------------------------------------------------------------------
-- 1. Reviews table ----------------------------------------------------------
-- ---------------------------------------------------------------------------
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  listing_id text not null references public.listings (id) on delete cascade,
  kind public.listing_kind not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  booking_reference text not null unique,           -- one review per booking
  rating int not null check (rating between 1 and 5),
  text text not null,
  category_ratings jsonb,                            -- stays: cleanliness/accuracy/… (optional)
  user_name text,
  user_avatar text,
  status text not null default 'visible' check (status in ('visible', 'hidden')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists reviews_listing_idx on public.reviews (listing_id);
create index if not exists reviews_user_idx on public.reviews (user_id);
create index if not exists reviews_status_idx on public.reviews (status);

alter table public.reviews enable row level security;

-- Visible reviews are public; a user always sees their own; admins see everything.
drop policy if exists "Reviews are readable" on public.reviews;
create policy "Reviews are readable" on public.reviews
  for select using (status = 'visible' or auth.uid() = user_id or public.is_admin());

-- Direct insert is NOT granted — reviews go through create_review() (verified booking).
drop policy if exists "Users update own reviews" on public.reviews;
create policy "Users update own reviews" on public.reviews
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users delete own reviews" on public.reviews;
create policy "Users delete own reviews" on public.reviews
  for delete to authenticated using (auth.uid() = user_id);

drop policy if exists "Admins moderate reviews" on public.reviews;
create policy "Admins moderate reviews" on public.reviews
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- 2. Verified review creation ----------------------------------------------
-- Only lets a signed-in user review a listing they booked (confirmed/completed).
-- ---------------------------------------------------------------------------
create or replace function public.create_review(
  p_booking_reference text,
  p_listing_id text,
  p_kind public.listing_kind,
  p_rating int,
  p_text text,
  p_category_ratings jsonb default null,
  p_user_name text default null,
  p_user_avatar text default null
)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_ok boolean;
begin
  if auth.uid() is null then raise exception 'You must be signed in to review.'; end if;

  select exists (
    select 1 from public.bookings b
    where b.reference = p_booking_reference
      and b.user_id = auth.uid()
      and b.listing_id = p_listing_id
      and b.status in ('confirmed', 'completed')
  ) into v_ok;
  if not v_ok then raise exception 'You can only review something you booked.'; end if;

  -- Identity comes from the reviewer's own profile, never the client payload, so a reviewer can't
  -- display someone else's name/avatar. p_user_name/p_user_avatar are kept for signature
  -- compatibility but deliberately ignored.
  insert into public.reviews
    (listing_id, kind, user_id, booking_reference, rating, text, category_ratings, user_name, user_avatar)
  values (
    p_listing_id, p_kind, auth.uid(), p_booking_reference, p_rating, p_text, p_category_ratings,
    (select full_name from public.profiles where id = auth.uid()),
    (select avatar_url from public.profiles where id = auth.uid())
  );
end;
$$;

grant execute on function public.create_review(text, text, public.listing_kind, int, text, jsonb, text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- 3. Computed ratings (public aggregates, no PII) ---------------------------
-- ---------------------------------------------------------------------------
create or replace view public.listing_ratings as
  select listing_id,
         round(avg(rating)::numeric, 1) as rating,
         count(*)::int as review_count
  from public.reviews
  where status = 'visible'
  group by listing_id;

grant select on public.listing_ratings to anon, authenticated;
