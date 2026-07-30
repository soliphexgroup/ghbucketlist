-- GH Bucketlist — ADMIN FOUNDATION (real moderation for the admin dashboard)
-- Run this once in the Supabase SQL Editor AFTER migration.sql and marketplace.sql.
-- Safe to re-run: uses "create or replace" / "if not exists" / "drop policy if exists" throughout.
--
-- Adds: an is_admin() gate, admin RLS on listings + bookings, a hardened signup trigger
-- (new users are always 'customer'), host applications + approve/decline, a payouts queue,
-- and user status management — all reachable from the normal browser client because the
-- privileged actions are SECURITY DEFINER functions guarded by is_admin().

-- ---------------------------------------------------------------------------
-- 1. Admin gate -------------------------------------------------------------
-- ---------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

grant execute on function public.is_admin() to authenticated;

-- ---------------------------------------------------------------------------
-- 2. Admin RLS on existing tables (added alongside the existing policies) ----
-- Multiple permissive policies are OR-ed, so these widen access for admins only.
-- ---------------------------------------------------------------------------
drop policy if exists "Admins read all listings" on public.listings;
create policy "Admins read all listings" on public.listings
  for select using (public.is_admin());

drop policy if exists "Admins update any listing" on public.listings;
create policy "Admins update any listing" on public.listings
  for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admins delete any listing" on public.listings;
create policy "Admins delete any listing" on public.listings
  for delete using (public.is_admin());

drop policy if exists "Admins read all bookings" on public.bookings;
create policy "Admins read all bookings" on public.bookings
  for select using (public.is_admin());

drop policy if exists "Admins update any booking" on public.bookings;
create policy "Admins update any booking" on public.bookings
  for update using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- 3. Harden signup: new accounts are always 'customer' ----------------------
-- Host access now comes through an approved application (below); admin stays manual SQL.
-- This ignores any 'role' passed in signup metadata so nobody can self-assign host/admin.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, role, full_name)
  values (new.id, 'customer', new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- 4. User status (active / suspended) ---------------------------------------
-- Column-locked like `role`: only the admin RPC below can change it.
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column if not exists status text not null default 'active'
  check (status in ('active', 'suspended'));

-- ---------------------------------------------------------------------------
-- 5. Host applications ------------------------------------------------------
-- ---------------------------------------------------------------------------
create table if not exists public.host_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  full_name text,
  email text,
  interest text,
  phone text,
  message text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'declined')),
  created_at timestamptz not null default now(),
  decided_at timestamptz,
  decided_by uuid references auth.users (id) on delete set null
);

create index if not exists host_applications_user_idx on public.host_applications (user_id);
create index if not exists host_applications_status_idx on public.host_applications (status);

alter table public.host_applications enable row level security;

drop policy if exists "Applicants create own applications" on public.host_applications;
create policy "Applicants create own applications" on public.host_applications
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "Applicants read own applications" on public.host_applications;
create policy "Applicants read own applications" on public.host_applications
  for select using (auth.uid() = user_id);

drop policy if exists "Admins read all applications" on public.host_applications;
create policy "Admins read all applications" on public.host_applications
  for select using (public.is_admin());

-- Approve: mark the application and promote the applicant to a real host.
create or replace function public.approve_host_application(p_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_user uuid;
begin
  if not public.is_admin() then raise exception 'Admin only'; end if;
  update public.host_applications
    set status = 'approved', decided_at = now(), decided_by = auth.uid()
    where id = p_id and status = 'pending'
    returning user_id into v_user;
  if v_user is null then raise exception 'Application not found or already decided'; end if;
  update public.profiles set role = 'host' where id = v_user;
end;
$$;

create or replace function public.decline_host_application(p_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  if not public.is_admin() then raise exception 'Admin only'; end if;
  update public.host_applications
    set status = 'declined', decided_at = now(), decided_by = auth.uid()
    where id = p_id and status = 'pending';
end;
$$;

grant execute on function public.approve_host_application(uuid) to authenticated;
grant execute on function public.decline_host_application(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 6. Payouts queue ----------------------------------------------------------
-- ---------------------------------------------------------------------------
create table if not exists public.payouts (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references auth.users (id) on delete cascade,
  amount numeric not null default 0,
  method text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  requested_at timestamptz not null default now(),
  decided_at timestamptz,
  decided_by uuid references auth.users (id) on delete set null
);

create index if not exists payouts_host_idx on public.payouts (host_id);
create index if not exists payouts_status_idx on public.payouts (status);

alter table public.payouts enable row level security;

drop policy if exists "Hosts create own payouts" on public.payouts;
create policy "Hosts create own payouts" on public.payouts
  for insert to authenticated with check (auth.uid() = host_id);

drop policy if exists "Hosts read own payouts" on public.payouts;
create policy "Hosts read own payouts" on public.payouts
  for select using (auth.uid() = host_id);

drop policy if exists "Admins read all payouts" on public.payouts;
create policy "Admins read all payouts" on public.payouts
  for select using (public.is_admin());

drop policy if exists "Admins update payouts" on public.payouts;
create policy "Admins update payouts" on public.payouts
  for update using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- 7. Admin user directory + status changes ----------------------------------
-- Email lives in auth.users (not profiles); this returns it for admins only.
-- ---------------------------------------------------------------------------
create or replace function public.admin_list_users()
returns table (
  id uuid,
  email text,
  full_name text,
  role text,
  status text,
  created_at timestamptz
)
language plpgsql
security definer set search_path = public
as $$
begin
  if not public.is_admin() then raise exception 'Admin only'; end if;
  return query
    select p.id, u.email::text, p.full_name, p.role, p.status, p.created_at
    from public.profiles p
    join auth.users u on u.id = p.id
    order by p.created_at desc;
end;
$$;

create or replace function public.admin_set_user_status(p_user uuid, p_status text)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  if not public.is_admin() then raise exception 'Admin only'; end if;
  if p_status not in ('active', 'suspended') then raise exception 'Invalid status'; end if;
  update public.profiles set status = p_status where id = p_user;
end;
$$;

grant execute on function public.admin_list_users() to authenticated;
grant execute on function public.admin_set_user_status(uuid, text) to authenticated;
