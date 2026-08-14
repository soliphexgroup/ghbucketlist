-- GH Bucketlist — PAYMENT-GATED BOOKINGS (security)
-- Run once in the Supabase SQL Editor AFTER marketplace.sql. Safe to re-run.
--
-- Closes the hole where create_booking was callable directly by any signed-in user (free/underpaid
-- confirmed bookings). After this, booking creation goes ONLY through the server (/api/bookings/create
-- → create_paid_booking with the service role), which requires a verified Paystack payment that
-- covers a server-computed base-price floor. The direct create_booking grant is revoked.

-- ---------------------------------------------------------------------------
-- 1. Verified payments ------------------------------------------------------
-- Written server-side by /api/paystack/verify after Paystack confirms a charge. The booking flow
-- checks against this — the client can never assert its own payment.
-- ---------------------------------------------------------------------------
create table if not exists public.verified_payments (
  reference text primary key,
  amount_pesewas int not null,          -- the ACTUAL amount Paystack reported, in pesewas
  currency text not null default 'GHS',
  verified_at timestamptz not null default now()
);

alter table public.verified_payments enable row level security;
-- No anon/authenticated policies: only the service role (which bypasses RLS) writes/reads it,
-- plus admins for auditing.
drop policy if exists "Admins read verified payments" on public.verified_payments;
create policy "Admins read verified payments" on public.verified_payments
  for select using (public.is_admin());

-- ---------------------------------------------------------------------------
-- 2. Tie each booking to its payment ----------------------------------------
-- A single payment can cover several booking rows (multi-room stay: ref-1, ref-2 …), so we sum the
-- totals booked under one payment_reference to make sure they don't exceed what was actually paid.
-- ---------------------------------------------------------------------------
alter table public.bookings add column if not exists payment_reference text;
create index if not exists bookings_payment_ref_idx on public.bookings (payment_reference);

-- ---------------------------------------------------------------------------
-- 3. Server-only booking creation -------------------------------------------
-- Same availability guarantees as create_booking (advisory lock + capacity/block re-check), but it
-- takes the user id explicitly (so it can run under the service role) and, for paid bookings,
-- enforces: (a) the recorded total is at least the listing's base price for the span, and (b) the
-- verified payment covers every total booked under this payment_reference.
-- ---------------------------------------------------------------------------
create or replace function public.create_paid_booking(
  p_user_id text,
  p_payment_reference text,
  p_row_reference text,
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
  p_request_only boolean,
  p_details jsonb default null
)
returns public.bookings
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := p_user_id::uuid;
  capacity int;
  taken int;
  is_blocked boolean;
  v_floor numeric;
  v_paid int;
  v_prior numeric;
  result public.bookings;
begin
  if uid is null then raise exception 'Missing user.' using errcode = '28000'; end if;
  if p_end <= p_start then raise exception 'Invalid date range.'; end if;

  -- Serialize concurrent bookings of the same unit.
  perform pg_advisory_xact_lock(hashtext(p_listing_id || ':' || coalesce(p_unit_key, '')));

  capacity := public.unit_capacity(p_listing_id, coalesce(p_unit_key, ''));
  if capacity <= 0 then raise exception 'This listing is not bookable.'; end if;

  select exists (
    select 1 from public.blocked_dates b
    where b.listing_id = p_listing_id
      and b.unit_key = coalesce(p_unit_key, '')
      and daterange(b.start_date, b.end_date, '[)') && daterange(p_start, p_end, '[)')
  ) into is_blocked;
  if is_blocked then raise exception 'Those dates are unavailable.'; end if;

  select coalesce(sum(b.units), 0) into taken
  from public.bookings b
  where b.listing_id = p_listing_id
    and b.unit_key = coalesce(p_unit_key, '')
    and b.status in ('pending', 'confirmed', 'completed')
    and daterange(b.start_date, b.end_date, '[)') && daterange(p_start, p_end, '[)');
  if taken + p_units > capacity then raise exception 'Not enough availability for those dates.'; end if;

  -- Paid (instant) bookings must clear the payment checks. Request-only bookings are pending and
  -- unpaid by design (the host approves, then the guest pays).
  if not p_request_only then
    -- Base-price floor: price_from is the listing's per-night / per-day / from price. Fees only add
    -- on top, so a legitimate total is always >= this. (Uses a small epsilon for float rounding.)
    select price_from * (p_end - p_start) * p_units into v_floor
    from public.listings where id = p_listing_id;
    if p_total + 0.01 < coalesce(v_floor, 0) then
      raise exception 'Booking total is below the listing price.';
    end if;

    select amount_pesewas into v_paid
    from public.verified_payments where reference = p_payment_reference;
    if v_paid is null then raise exception 'Payment not verified.'; end if;

    select coalesce(sum(total), 0) into v_prior
    from public.bookings
    where payment_reference = p_payment_reference
      and status in ('pending', 'confirmed', 'completed');
    if round((v_prior + p_total) * 100) > v_paid then
      raise exception 'Payment does not cover this booking.';
    end if;
  end if;

  insert into public.bookings (
    reference, kind, listing_id, unit_key, user_id, guest_name, guest_email,
    start_date, end_date, units, guests, total, status, details, payment_reference
  ) values (
    p_row_reference, p_kind, p_listing_id, coalesce(p_unit_key, ''), uid, p_guest_name, p_guest_email,
    p_start, p_end, p_units, p_guests, p_total,
    (case when p_request_only then 'pending' else 'confirmed' end)::public.booking_status,
    p_details, p_payment_reference
  )
  returning * into result;

  return result;
end $$;

-- Only the service role may create bookings now (called from /api/bookings/create). Never grant this
-- to anon/authenticated — that would reopen the hole.
revoke execute on function public.create_paid_booking(
  text, text, text, public.listing_kind, text, text, date, date, int, int, numeric, text, text, boolean, jsonb
) from public;
grant execute on function public.create_paid_booking(
  text, text, text, public.listing_kind, text, text, date, date, int, int, numeric, text, text, boolean, jsonb
) to service_role;

-- ---------------------------------------------------------------------------
-- 4. Close the direct path --------------------------------------------------
-- The old create_booking (client-callable, no payment check) is retired: revoke it from the browser
-- roles so a booking can only be made through the server flow above.
-- ---------------------------------------------------------------------------
revoke execute on function public.create_booking(
  text, public.listing_kind, text, text, date, date, int, int, numeric, text, text, jsonb
) from anon, authenticated, public;
