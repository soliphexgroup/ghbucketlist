# Plan — Payment-gated bookings (security, pre-launch)

## The hole
`create_booking` is granted to `authenticated` and only checks availability/capacity — **not
payment**. Any signed-in user can call the RPC directly (public anon endpoint, e.g. from devtools)
and create a **confirmed** booking without paying, or block a listing's dates for free. Separately,
`/api/paystack/verify` trusts a client-supplied `expectedAmountPesewas`, so the paid amount isn't
checked against the listing's real price.

Impact: revenue loss (free/underpaid confirmed bookings) and inventory DoS (blocking dates for free).
Requires a technical attacker (hand-calling RPCs), so it's not casual — but it's real.

## Why it's not a one-line fix (findings from tracing the flow)
- A **single Paystack payment can cover a multi-room stay** written as several booking rows
  (`ref-1`, `ref-2`, …) — see `bookInDb` in `stay-booking-dialog.tsx`. Payment verification can't be
  a naive per-row check.
- The current `create_booking` uses `auth.uid()` internally, so it **can't be called server-side via
  the service role** (auth.uid() is null there). A server-only variant taking an explicit user id is
  needed.
- It's the **money path** and must be verified end-to-end on staging with **live Paystack** before
  being relied on. Do not ship blind.

## Target design
Route all booking creation through a server API that (a) verifies payment server-side and (b) is the
only thing allowed to write bookings.

1. **DB**
   - New `public.verified_payments (reference text primary key, amount_pesewas int, currency text,
     verified_at timestamptz default now())`, admin-read RLS. Written only server-side.
   - New `create_booking_server(p_user_id uuid, …same args…)` — SECURITY DEFINER, **not granted to
     anon/authenticated** (service-role only). Same advisory-lock + availability/capacity logic as
     `create_booking`, but inserts with the passed `p_user_id` instead of `auth.uid()`.
   - **Revoke** execute on `create_booking(...)` from `public, anon, authenticated` (the switch that
     actually closes the hole). Keep it callable by service role for the server path, or retire it.
2. **`/api/paystack/verify`** — on a successful verify, also `insert into verified_payments` (service
   role) the reference + **actual** Paystack amount/currency. Stop trusting the client's expected
   amount for anything but a soft UX check.
3. **New `/api/bookings/create`** (server) — auth the session → for each unit in the request,
   recompute the authoritative price from the listing (`listings.data`) server-side → for **instant**
   bookings require a `verified_payments` row whose amount covers the sum of the recomputed totals →
   create rows via `create_booking_server` (service role) using the **server** totals. For
   **request-only** bookings, create as `pending` with no payment (unchanged UX; host approves).
4. **Client** — change `createDbBooking` (`src/lib/db-bookings.ts`) to POST `/api/bookings/create`
   instead of calling the RPC directly; keep its input/output types identical so the three booking
   dialogs are untouched. The dialog still runs Paystack first; the API verifies it.

## Verification (must do on staging, live Paystack)
- Instant single-unit booking end-to-end → row created, `verified_payments` has the real amount.
- **Multi-room stay** (the tricky case) → all rows created under one payment; sum ≤ paid amount.
- Request-only booking → pending row, no payment required.
- Attack checks: calling `create_booking`/`create_booking_server` directly as a normal user now
  fails (grant revoked); replaying `/api/bookings/create` without a `verified_payments` row fails;
  paying less than the recomputed price is rejected.
- `npx tsc --noEmit` clean; production build compiles the new routes.

## Rollback
The single lever is the `create_booking` grant. If the new path misbehaves, `grant execute on
function public.create_booking(...) to authenticated;` restores the old flow instantly while fixing.

## Residual/related (smaller)
- Payout `amount` isn't validated against the host's real earnings on insert (admin approval is the
  backstop) — validate `amount ≤ available balance` in an RPC.
