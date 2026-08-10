-- GH Bucketlist — BUCKET REWARDS (BR): community discount & referral network
-- Run once in the Supabase SQL Editor AFTER migration.sql and admin.sql (needs is_admin()).
-- Safe to re-run: uses "if not exists" / "create or replace" / "drop policy if exists" throughout.
--
-- Model: partner businesses offer a discount split between the customer (a real saving) and
-- Ghbucketlist (commission). Members are identified by phone number (no app login). The counter
-- device redeems through a token-gated web page; all its actions go through SECURITY DEFINER RPCs
-- so the device never touches tables directly and member data isn't publicly enumerable.

-- ---------------------------------------------------------------------------
-- 1. Partners ---------------------------------------------------------------
-- ---------------------------------------------------------------------------
create table if not exists public.br_partners (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  category text,                       -- e.g. restaurant, fast-food, salon, spa
  area text,                           -- neighbourhood / service area
  tier text not null default 'starter' check (tier in ('starter', 'featured', 'premium')),
  status text not null default 'active' check (status in ('active', 'paused')),
  total_discount_pct numeric not null default 10,
  customer_pct numeric not null default 7,
  commission_pct numeric not null default 3,
  device_token text not null unique default replace(gen_random_uuid()::text, '-', ''),
  image_url text,
  description text,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists br_partners_status_idx on public.br_partners (status);
create index if not exists br_partners_token_idx on public.br_partners (device_token);

alter table public.br_partners enable row level security;

-- Admins manage everything on the base table (which holds the secret device_token).
drop policy if exists "Active partners are public" on public.br_partners;
drop policy if exists "Admins manage partners" on public.br_partners;
create policy "Admins manage partners" on public.br_partners
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- The public /rewards directory reads this view instead of the table, so device_token is never
-- exposed. The view runs with owner rights (bypasses RLS) and returns only active partners.
create or replace view public.br_public_partners as
  select id, name, slug, category, area, tier, total_discount_pct, customer_pct,
         commission_pct, image_url, description, created_at
  from public.br_partners
  where status = 'active';

grant select on public.br_public_partners to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 2. Members (phone-based; no login) ----------------------------------------
-- ---------------------------------------------------------------------------
create table if not exists public.br_members (
  id uuid primary key default gen_random_uuid(),
  phone text not null unique,
  name text,
  user_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.br_members enable row level security;

-- Anyone may join (public sign-up). Reading the member list is admin-only (privacy); the counter
-- device never selects members directly — it goes through br_lookup_member / br_redeem.
drop policy if exists "Anyone can join BR" on public.br_members;
create policy "Anyone can join BR" on public.br_members
  for insert to anon, authenticated with check (true);

drop policy if exists "Admins read members" on public.br_members;
create policy "Admins read members" on public.br_members
  for select using (public.is_admin());

-- ---------------------------------------------------------------------------
-- 3. Redemptions ------------------------------------------------------------
-- Written only by br_redeem(); readable by admins for tracking/commission.
-- ---------------------------------------------------------------------------
create table if not exists public.br_redemptions (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.br_partners (id) on delete cascade,
  member_phone text not null,
  amount numeric not null,
  total_discount_pct numeric not null,
  customer_saving numeric not null,
  commission numeric not null,
  created_at timestamptz not null default now()
);

create index if not exists br_redemptions_partner_idx on public.br_redemptions (partner_id);
create index if not exists br_redemptions_created_idx on public.br_redemptions (created_at);

alter table public.br_redemptions enable row level security;

drop policy if exists "Admins read redemptions" on public.br_redemptions;
create policy "Admins read redemptions" on public.br_redemptions
  for select using (public.is_admin());

-- ---------------------------------------------------------------------------
-- 4. RPCs -------------------------------------------------------------------
-- ---------------------------------------------------------------------------

-- Join BR (or no-op if the phone is already a member). Fills a missing name.
create or replace function public.br_signup(p_phone text, p_name text default null)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  if coalesce(trim(p_phone), '') = '' then raise exception 'Phone is required'; end if;
  insert into public.br_members (phone, name)
  values (trim(p_phone), nullif(trim(coalesce(p_name, '')), ''))
  on conflict (phone) do update
    set name = coalesce(public.br_members.name, excluded.name);
end;
$$;

-- Resolve a partner from its device token and check whether a phone is a member.
create or replace function public.br_lookup_member(p_token text, p_phone text)
returns table (found boolean, name text)
language plpgsql
security definer set search_path = public
as $$
declare
  v_partner public.br_partners;
  v_member public.br_members;
begin
  select * into v_partner from public.br_partners where device_token = p_token and status = 'active';
  if not found then raise exception 'Invalid or inactive device'; end if;

  select * into v_member from public.br_members where phone = trim(p_phone);
  if not found then
    return query select false, null::text;
  else
    return query select true, v_member.name;
  end if;
end;
$$;

-- Log a redemption for a member at a partner; computes the split server-side.
create or replace function public.br_redeem(p_token text, p_phone text, p_amount numeric)
returns table (member_name text, customer_saving numeric, amount_due numeric, commission numeric)
language plpgsql
security definer set search_path = public
as $$
declare
  v_partner public.br_partners;
  v_member public.br_members;
  v_saving numeric;
  v_commission numeric;
begin
  select * into v_partner from public.br_partners where device_token = p_token and status = 'active';
  if not found then raise exception 'Invalid or inactive device'; end if;
  if p_amount is null or p_amount <= 0 then raise exception 'Amount must be greater than zero'; end if;

  select * into v_member from public.br_members where phone = trim(p_phone);
  if not found then raise exception 'Not a member'; end if;

  v_saving := round(p_amount * v_partner.customer_pct / 100.0, 2);
  v_commission := round(p_amount * v_partner.commission_pct / 100.0, 2);

  insert into public.br_redemptions
    (partner_id, member_phone, amount, total_discount_pct, customer_saving, commission)
  values
    (v_partner.id, v_member.phone, p_amount, v_partner.total_discount_pct, v_saving, v_commission);

  return query select v_member.name, v_saving, (p_amount - v_saving), v_commission;
end;
$$;

grant execute on function public.br_signup(text, text) to anon, authenticated;
grant execute on function public.br_lookup_member(text, text) to anon, authenticated;
grant execute on function public.br_redeem(text, text, numeric) to anon, authenticated;

-- Confirm a device token resolves to a partner (so the counter app can show "This device: <name>")
-- and hand back the partner's discount rates, so the device can compute the split offline.
drop function if exists public.br_device_info(text);
create or replace function public.br_device_info(p_token text)
returns table (name text, active boolean, total_discount_pct numeric, customer_pct numeric, commission_pct numeric)
language plpgsql
security definer set search_path = public
as $$
begin
  return query
    select p.name, (p.status = 'active'), p.total_discount_pct, p.customer_pct, p.commission_pct
    from public.br_partners p
    where p.device_token = p_token;
end;
$$;

grant execute on function public.br_device_info(text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 5. Settlement (commission reconciliation) ---------------------------------
-- Redemptions start unsettled; an admin marks a partner's commission paid per cycle.
-- ---------------------------------------------------------------------------
alter table public.br_redemptions add column if not exists settled_at timestamptz;

-- Mark all of a partner's currently-unsettled redemptions as settled; returns the amount settled.
create or replace function public.br_settle_partner(p_partner_id uuid)
returns numeric
language plpgsql
security definer set search_path = public
as $$
declare
  v_total numeric;
begin
  if not public.is_admin() then raise exception 'Admin only'; end if;
  select coalesce(sum(commission), 0) into v_total
  from public.br_redemptions
  where partner_id = p_partner_id and settled_at is null;

  update public.br_redemptions
  set settled_at = now()
  where partner_id = p_partner_id and settled_at is null;

  return v_total;
end;
$$;

grant execute on function public.br_settle_partner(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 6. Offline support --------------------------------------------------------
-- The counter device keeps working with no internet: it caches the partner's discount rates
-- (from br_device_info above) and a SHA-256 digest of member phones (below), so it can compute
-- the discount and check membership offline, then syncs queued sales via br_redeem_offline().
-- ---------------------------------------------------------------------------
create extension if not exists pgcrypto;

-- Hashed member phones for offline membership checks. Only hashes ever leave the server — never
-- raw numbers. Token-gated. Members are global, so every active device caches the same set.
create or replace function public.br_member_digest(p_token text)
returns table (phone_hash text)
language plpgsql
security definer set search_path = public, extensions
stable
as $$
begin
  if not exists (
    select 1 from public.br_partners where device_token = p_token and status = 'active'
  ) then
    raise exception 'Invalid or inactive device';
  end if;
  return query
    select encode(digest(m.phone, 'sha256'), 'hex') from public.br_members m;
end;
$$;

grant execute on function public.br_member_digest(text) to anon, authenticated;

-- Offline sales that failed validation on sync (e.g. the phone turned out not to be a member, so
-- a discount was given in error), kept for the admin team to follow up. Written by br_redeem_offline.
create table if not exists public.br_failed_redemptions (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid references public.br_partners (id) on delete set null,
  device_token text,
  member_phone text,
  amount numeric,
  reason text not null,               -- 'not_member' | 'unknown_device' | 'invalid_amount'
  occurred_at timestamptz,            -- when the offline sale was rung up on the device
  created_at timestamptz not null default now()
);

create index if not exists br_failed_partner_idx on public.br_failed_redemptions (partner_id);
create index if not exists br_failed_created_idx on public.br_failed_redemptions (created_at);

alter table public.br_failed_redemptions enable row level security;

drop policy if exists "Admins read failed redemptions" on public.br_failed_redemptions;
create policy "Admins read failed redemptions" on public.br_failed_redemptions
  for select using (public.is_admin());

-- Sync one queued offline redemption. Unlike br_redeem (which raises on a non-member so the live
-- counter blocks the sale), this LOGS failures to br_failed_redemptions and returns
-- status='rejected' so the device drops the item. Records the original sale time via p_at.
create or replace function public.br_redeem_offline(
  p_token text, p_phone text, p_amount numeric, p_at timestamptz default now()
)
returns table (status text, member_name text, customer_saving numeric, amount_due numeric, commission numeric)
language plpgsql
security definer set search_path = public
as $$
declare
  v_partner public.br_partners;
  v_member public.br_members;
  v_saving numeric;
  v_commission numeric;
begin
  select * into v_partner from public.br_partners where device_token = p_token and status = 'active';
  if not found then
    insert into public.br_failed_redemptions (partner_id, device_token, member_phone, amount, reason, occurred_at)
      values (null, p_token, trim(p_phone), p_amount, 'unknown_device', p_at);
    return query select 'rejected'::text, null::text, null::numeric, null::numeric, null::numeric;
    return;
  end if;

  if p_amount is null or p_amount <= 0 then
    insert into public.br_failed_redemptions (partner_id, device_token, member_phone, amount, reason, occurred_at)
      values (v_partner.id, p_token, trim(p_phone), p_amount, 'invalid_amount', p_at);
    return query select 'rejected'::text, null::text, null::numeric, null::numeric, null::numeric;
    return;
  end if;

  select * into v_member from public.br_members where phone = trim(p_phone);
  if not found then
    insert into public.br_failed_redemptions (partner_id, device_token, member_phone, amount, reason, occurred_at)
      values (v_partner.id, p_token, trim(p_phone), p_amount, 'not_member', p_at);
    return query select 'rejected'::text, null::text, null::numeric, null::numeric, null::numeric;
    return;
  end if;

  v_saving := round(p_amount * v_partner.customer_pct / 100.0, 2);
  v_commission := round(p_amount * v_partner.commission_pct / 100.0, 2);

  insert into public.br_redemptions
    (partner_id, member_phone, amount, total_discount_pct, customer_saving, commission, created_at)
  values
    (v_partner.id, v_member.phone, p_amount, v_partner.total_discount_pct, v_saving, v_commission, coalesce(p_at, now()));

  return query select 'ok'::text, v_member.name, v_saving, (p_amount - v_saving), v_commission;
end;
$$;

grant execute on function public.br_redeem_offline(text, text, numeric, timestamptz) to anon, authenticated;
