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
-- STEP 2 — Clear the seed (RECOMMENDED: keep Handyman services)
-- Removes seeded stays, cars, and experiences. Real hosts repopulate these from the host
-- dashboard. Handyman services are kept because there is no self-serve way to add providers yet.
-- Uncomment the delete below to run it.
-- ---------------------------------------------------------------------------
-- delete from public.listings
-- where created_by is null
--   and kind in ('stay', 'car', 'experience');

-- ---------------------------------------------------------------------------
-- STEP 2 (ALTERNATIVE) — Clear EVERYTHING, including services
-- Handyman Services will be empty at launch with no UI to add providers (re-add later via SQL).
-- Use this INSTEAD of the recommended delete above, not in addition.
-- ---------------------------------------------------------------------------
-- delete from public.listings
-- where created_by is null;

-- ---------------------------------------------------------------------------
-- STEP 3 — Verify (after deleting)
-- Should show only real host listings (created_by not null), plus kept services if you used the
-- recommended option.
-- ---------------------------------------------------------------------------
-- select kind, created_by is null as is_seed, count(*)
-- from public.listings
-- group by kind, (created_by is null)
-- order by kind, is_seed;
