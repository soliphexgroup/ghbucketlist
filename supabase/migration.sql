-- GH Bucketlist auth setup.
-- Run this once in your Supabase project's SQL Editor (Dashboard > SQL Editor > New query).
-- Safe to re-run: uses "create or replace" / "if not exists" throughout.

-- 1. Profiles table -----------------------------------------------------
-- Holds the app-specific fields Supabase's built-in auth.users table doesn't have,
-- most importantly `role`, which decides which dashboard a signed-in user can reach.
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null check (role in ('customer', 'host', 'admin')) default 'customer',
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Profiles are readable by anyone signed in (host names/avatars are shown publicly
-- throughout the marketplace), but a user can only ever modify their own row.
drop policy if exists "Profiles are viewable by everyone" on public.profiles;
create policy "Profiles are viewable by everyone"
  on public.profiles for select
  using (true);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Supabase grants table-level UPDATE to `authenticated` by default, which combined with
-- the row policy above would let a user set their own role. Column-level privileges close
-- that gap: authenticated users can update their name/avatar, but not role or id.
revoke update on public.profiles from authenticated;
grant update (full_name, avatar_url) on public.profiles to authenticated;

-- 2. Auto-create a profile row whenever someone signs up ----------------
-- `role` and `full_name` come from the metadata passed to supabase.auth.signUp()
-- at signup time (see src/app/signup/page.tsx). Defaults to 'customer' if absent.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, role, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'role', 'customer'),
    new.raw_user_meta_data ->> 'full_name'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 3. Promoting someone to admin ------------------------------------------
-- There's no self-serve admin signup. To grant admin access, run this manually
-- for the account after they've signed up normally as a customer or host:
--
--   update public.profiles set role = 'admin' where id =
--     (select id from auth.users where email = 'admin@example.com');

-- 4. Listing images bucket -----------------------------------------------
-- Photos hosts upload for their experiences, properties and cars. Listing photos are
-- shown publicly across the marketplace, so the bucket is public-read; writes are
-- restricted to signed-in users, and each host can only touch their own folder.
-- Files are stored as `listing-images/<host-id>/<filename>`.
insert into storage.buckets (id, name, public)
values ('listing-images', 'listing-images', true)
on conflict (id) do update set public = true;

drop policy if exists "Listing images are publicly readable" on storage.objects;
create policy "Listing images are publicly readable"
  on storage.objects for select
  using (bucket_id = 'listing-images');

-- The first path segment is the uploader's user id, so a host can only write in
-- their own folder even though the bucket is shared.
drop policy if exists "Hosts can upload their own listing images" on storage.objects;
create policy "Hosts can upload their own listing images"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'listing-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Hosts can replace their own listing images" on storage.objects;
create policy "Hosts can replace their own listing images"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'listing-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Hosts can delete their own listing images" on storage.objects;
create policy "Hosts can delete their own listing images"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'listing-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
