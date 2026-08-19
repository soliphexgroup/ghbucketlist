-- GH Bucketlist — CLEAR SEED (prepare the marketplace for a real launch)
-- Run in the Supabase SQL Editor. This removes the fabricated demo catalog so the public
-- marketplace shows only genuine, host-published listings.
--
-- Safety: seeded listings are exactly the rows with created_by IS NULL (seed.sql never sets it),
-- while real host-created listings always have created_by = the host's auth uid. So these deletes
-- can NEVER touch a real host's listing. Deleting a listing cascades to any bookings/reviews on it
-- (foreign keys are ON DELETE CASCADE) — intended, since those would be test data on demo listings.
--
-- ⚠️ This is destructive and not automatically reversible. To restore the demo catalog later,
--    re-run supabase/seed.sql. Consider taking a snapshot/backup first if unsure.

-- ---------------------------------------------------------------------------
-- STEP 1 — Preview (run this first; it changes nothing)
-- See exactly what the clear will remove, grouped by kind.
-- ---------------------------------------------------------------------------
select kind, count(*) as seeded_listings
from public.listings
where created_by is null
group by kind
order by kind;

-- Bookings/reviews that would cascade away with the seeded listings:
select 'bookings' as table, count(*) from public.bookings
  where listing_id in (select id from public.listings where created_by is null)
union all
select 'reviews', count(*) from public.reviews
  where listing_id in (select id from public.listings where created_by is null);

-- ---------------------------------------------------------------------------
-- STEP 2 (RECOMMENDED) — Clear ALL seeded listings, including services
-- Every vertical is now self-serve: hosts repopulate stays, cars, experiences, AND handyman
-- services from the host dashboard (e.g. My Services → Add New Service), and admins grant the
-- verified badge from Admin → Listings. So the whole demo catalog can go. Uncomment to run.
-- ---------------------------------------------------------------------------
-- delete from public.listings
-- where created_by is null;

-- ---------------------------------------------------------------------------
-- STEP 2 (ALTERNATIVE) — Keep the seeded Handyman services
-- Use this if you'd rather the Services page isn't empty on day one — it keeps the demo providers
-- visible and clears only stays, cars, and experiences. (Real hosts can still add their own
-- services alongside them.) Use this INSTEAD of the recommended delete above, not in addition.
-- ---------------------------------------------------------------------------
-- delete from public.listings
-- where created_by is null
--   and kind in ('stay', 'car', 'experience');

-- ---------------------------------------------------------------------------
-- STEP 3 — Verify (after deleting)
-- Should show only real host listings (created_by not null) — plus the seeded services if you
-- used the alternative that keeps them.
-- ---------------------------------------------------------------------------
-- select kind, created_by is null as is_seed, count(*)
-- from public.listings
-- group by kind, (created_by is null)
-- order by kind, is_seed;
