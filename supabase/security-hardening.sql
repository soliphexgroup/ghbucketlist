-- GH Bucketlist — SECURITY HARDENING (from the Supabase Security Advisor)
-- Run once in the Supabase SQL Editor AFTER the other scripts. Safe to re-run.
--
-- Addresses the advisor warnings that are worth acting on. The remaining SECURITY DEFINER
-- warnings are intentional and self-protecting (see notes at the bottom) — don't "fix" those.
-- NOTE: "Leaked Password Protection" is a dashboard toggle, not SQL — enable it under
-- Authentication → Sign In / Providers → Passwords.

-- ---------------------------------------------------------------------------
-- 1. REAL FIX — lock down create_paid_booking to the service role only.
-- Supabase auto-grants EXECUTE on public functions to anon + authenticated, so the earlier
-- `revoke ... from public` in payment-gating.sql did NOT remove those. Unlike our other RPCs,
-- create_paid_booking has NO internal caller check (it takes p_user_id as an argument and trusts
-- it), so being callable by signed-in users lets them bypass the server booking flow (create
-- unpaid pending bookings, or attribute bookings to another user's id). The API calls it via the
-- service role, which keeps its grant — so the app is unaffected.
-- ---------------------------------------------------------------------------
revoke execute on function public.create_paid_booking(
  text, text, text, public.listing_kind, text, text, date, date, int, int, numeric, text, text, boolean, jsonb
) from anon, authenticated;

-- ---------------------------------------------------------------------------
-- 2. Defense-in-depth — admin/settle RPCs should not be callable by anon.
-- They already reject non-admins via an internal is_admin() check, so this is belt-and-braces.
-- Keep the `authenticated` grant: admins ARE authenticated users and call these from the dashboard,
-- and is_admin() is the real gate. (The advisor will still list a "signed-in" warning for these —
-- that is expected and correct.)
-- ---------------------------------------------------------------------------
revoke execute on function public.admin_list_users() from anon;
revoke execute on function public.admin_set_user_status(uuid, text) from anon;
revoke execute on function public.approve_host_application(uuid) from anon;
revoke execute on function public.decline_host_application(uuid) from anon;
revoke execute on function public.br_settle_partner(uuid) from anon;

-- ---------------------------------------------------------------------------
-- 3. Pin a stable search_path on unit_capacity (advisor: "Function Search Path Mutable").
-- ---------------------------------------------------------------------------
alter function public.unit_capacity(text, text) set search_path = public;

-- ---------------------------------------------------------------------------
-- 4. Remove the wide-open member INSERT policy (advisor: "RLS Policy Always True").
-- Members join only through br_signup() (SECURITY DEFINER, so it still works with no policy), so a
-- direct anon INSERT with `with check (true)` is unnecessary spam surface.
-- ---------------------------------------------------------------------------
drop policy if exists "Anyone can join BR" on public.br_members;

-- ---------------------------------------------------------------------------
-- Intentionally NOT changed (safe by design — leave them):
--   • Views listing_booked_ranges / br_public_partners / listing_ratings (SECURITY DEFINER) —
--     required so anonymous visitors see public availability/directory data with no PII.
--   • br_device_info / br_lookup_member / br_member_digest / br_redeem / br_redeem_offline /
--     br_signup callable by anon — the counter device has no login; the URL token is the credential
--     and each function validates it.
--   • create_review / request_payout / is_admin — self-protecting via auth.uid() / internal checks.
--   • handle_new_user — a signup trigger; a direct call just errors.
--   • storage.listing-images public listing — listing photos are public by design.
-- ---------------------------------------------------------------------------
