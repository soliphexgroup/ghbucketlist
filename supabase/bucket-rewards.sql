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
