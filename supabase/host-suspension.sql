-- GH Bucketlist — HOST SUSPENSION enforcement
-- Makes profiles.status = 'suspended' actually mean something: a suspended host's listings are
-- hidden from the public, and the host can no longer create new listings. Admins still see and
-- manage everything (via the "Admins ..." policies), and the host still sees their own listings.
--
-- Run in the Supabase SQL Editor. Safe to re-run (drop/create + create-or-replace throughout).
-- Pairs with the admin Hosts page, which flips profiles.status via admin_set_user_status().

-- ---------------------------------------------------------------------------
-- Helper: is this user suspended?
-- SECURITY DEFINER so it can read profiles regardless of the caller's RLS. STABLE so the planner
-- can cache it per statement. Returns false for a null uid (e.g. seeded listings with no owner).
-- ---------------------------------------------------------------------------
create or replace function public.user_suspended(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.profiles where id = uid and status = 'suspended');
$$;

grant execute on function public.user_suspended(uuid) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Public/owner read: a listing is visible when it's active AND its host is NOT suspended.
-- The owner still sees their own (so they can tell it's been hidden), and admins see everything
-- via their separate "Admins read all listings" policy (permissive policies are OR-ed together).
-- ---------------------------------------------------------------------------
drop policy if exists "Listings are readable" on public.listings;
create policy "Listings are readable" on public.listings
  for select using (
    (is_active and not public.user_suspended(created_by))
    or auth.uid() = created_by
  );

-- ---------------------------------------------------------------------------
-- Suspended hosts cannot create new listings.
-- ---------------------------------------------------------------------------
drop policy if exists "Users create own listings" on public.listings;
create policy "Users create own listings" on public.listings
  for insert to authenticated with check (
    auth.uid() = created_by
    and not public.user_suspended(auth.uid())
  );
