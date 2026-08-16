# Deploying GH Bucketlist to Hostinger (Node.js Web App)

This app is a **Next.js 16 app that runs as a live Node.js server** — it is *not* a
static site. Detail pages server-render from Supabase and `/dashboard/*` is protected by
middleware, so it must run with `next build` + `next start` on a Node runtime.

## 0. Plan requirement (check this first)
You need a Hostinger plan that runs **Node.js apps** (Business/Cloud web hosting with the
Node.js app feature, or a VPS). Plain shared/static hosting **cannot** run this app.

- Node version: **20.9 or newer** (pinned in `package.json` → `engines.node`).

## 1. Build & start commands
| Setting | Value |
|---|---|
| Install | `npm ci` (or `npm install`) |
| Build | `npm run build` |
| Start | `npm start` &nbsp;(= `next start`) |
| Port | Next reads the `PORT` env var Hostinger provides — no change needed |

If Hostinger builds on their server, point it at this repo and use the commands above.
If it expects a pre-built upload, run `npm ci && npm run build` locally and upload the repo
**including** the generated `.next/` folder, then run `npm start`.

## 2. Environment variables (set in Hostinger, not committed)
Copy the values from your local `.env.local`:

| Variable | Scope | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | public | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | public | Supabase anon key |
| `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` | public | Paystack `pk_...` |
| `PAYSTACK_SECRET_KEY` | **server-only** | Paystack `sk_...` — never expose to the browser |
| `RESEND_API_KEY` | **server-only** | Resend API key for transactional email (`re_...`) |
| `SUPABASE_SERVICE_ROLE_KEY` | **server-only** | Supabase → Project Settings → API → service_role key. Bypasses RLS — server only; used to look up host emails for notifications |
| `EMAIL_FROM` | server-only | Sender, e.g. `GH Bucketlist <no-reply@ghbucketlist.com>` (must be a verified Resend sender) |
| `CRON_SECRET` | **server-only** | Any long random string. The calendar-sync cron job sends it as a Bearer token so only your scheduler can trigger the sync. |

`NEXT_PUBLIC_*` vars are inlined at **build time**, so if you change them you must rebuild.

### Transactional email (Resend) setup
1. Create a [Resend](https://resend.com) account and add the domain **ghbucketlist.com**.
2. Add the DNS records Resend gives you (SPF/DKIM) to the domain, and wait for verification.
3. Set `EMAIL_FROM` to a sender on the verified domain (e.g. `no-reply@ghbucketlist.com`).
4. Put `RESEND_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and `EMAIL_FROM` in Hostinger env vars (and `.env.local` for local testing).

Until this is configured the app runs normally — the notify calls just no-op (no emails send).
Emails fire after: a booking (→ guest + host), a host-application approve/decline (→ applicant),
and a payout approve/reject (→ host).

## 3. Domain + Supabase URLs (do after the app is live)
Once the app answers on its Hostinger domain (e.g. `https://ghbucketlist.com`):

1. Point your domain at the Hostinger app. **Live domain: `https://ghbucketlist.com`.**
2. In **Supabase → Authentication → URL Configuration**:
   - **Site URL:** `https://ghbucketlist.com`
   - **Redirect URLs:** add `https://ghbucketlist.com/reset-password` and
     `https://ghbucketlist.com/**` (the wildcard covers any future auth redirect paths);
     keep `http://localhost:3010/reset-password` for local testing.
   - Remove the old `aqua-eagle-…hostingersite.com` / Vercel entries.
   The reset link is generated from the visited origin, so on the live domain it becomes
   `https://ghbucketlist.com/reset-password` automatically — no code change needed.

## 4. Database SQL scripts (run in the Supabase SQL Editor, in this order)
Run once per Supabase project. All three are idempotent (safe to re-run).

| Script | Purpose | Status |
|---|---|---|
| `supabase/migration.sql` | Auth: profiles, roles, signup trigger, image storage bucket | already run ✅ |
| `supabase/marketplace.sql` | Listings, bookings, availability, `create_booking` RPC | already run ✅ |
| `supabase/admin.sql` | **Admin dashboard**: `is_admin()`, admin RLS, host applications + approve/decline, payouts, user status, `admin_list_users()` | **run this** 🔴 |
| `supabase/bucket-rewards.sql` | **Bucket Rewards**: partners, members, redemptions + token-gated `br_signup` / `br_lookup_member` / `br_redeem` RPCs. Also the **offline** additions — `br_member_digest` (hashed member list), `br_failed_redemptions`, `br_redeem_offline`, extended `br_device_info`, and the `pgcrypto` extension | **run / re-run this** 🔴 |
| `supabase/reviews.sql` | **Reviews**: reviews table + verified `create_review` RPC + `listing_ratings` view (ratings computed from real reviews) | **run this** 🔴 |
| `supabase/payment-gating.sql` | **Payment-gated bookings** (security): `verified_payments`, `bookings.payment_reference`, server-only `create_paid_booking`, and **revokes** the client-callable `create_booking`. Run AFTER marketplace + admin. **After running, bookings only work through `/api/bookings/create`, so verify a real booking on staging.** | **run this** 🔴 |
| `supabase/security-hardening.sql` | **Security Advisor fixes**: revokes `create_paid_booking` from anon/authenticated (service-role only — the important one), revokes admin RPCs from anon, pins `unit_capacity` search_path, drops the wide-open `br_members` insert policy. Run AFTER payment-gating + admin. Also enable **Auth → Leaked Password Protection** (dashboard toggle). | **run this** 🔴 |
| `supabase/calendar-sync.sql` | **Calendar sync** (Booking.com iCal): `calendar_feeds` table (owner-RLS) + tags `blocked_dates` with `source`/`feed_id`. Run AFTER marketplace. Then set `CRON_SECRET` and schedule the cron below. | **run this** 🔴 |

`admin.sql` and `bucket-rewards.sql` depend on `migration.sql` + `marketplace.sql` (and
`bucket-rewards.sql` also needs `is_admin()` from `admin.sql`). Until they're run, the admin
dashboard pages, the `/hosting` application flow, and the `/rewards` Bucket Rewards pages will
error because their tables/RPCs don't exist yet. After running them, promote your own account to
admin:

```sql
update public.profiles set role='admin'
where id=(select id from auth.users where email='<you>');
```

**Re-run `bucket-rewards.sql` after the offline update.** If you already ran an earlier version,
re-run the whole file to pick up offline support: it drops/recreates `br_device_info` (now returns
the partner's discount rates), adds `br_member_digest`, `br_failed_redemptions`, `br_redeem_offline`,
and `create extension if not exists pgcrypto`. It's idempotent. Without this, the counter device
can't compute discounts or verify members offline. If `pgcrypto` errors on your instance (schema
restrictions), tell your developer — the hashing function's `search_path` may need adjusting.

**Launch prep (optional, destructive):** `supabase/clear-seed.sql` removes the fabricated demo
catalog so the marketplace shows only real host-published listings. It's not part of setup — run
it only when you're ready to go live. It previews what it will delete first, and only ever removes
seeded rows (`created_by IS NULL`), never real host listings.

## 5. Calendar sync (Booking.com iCal) — scheduling + host guide
After running `calendar-sync.sql` and setting `CRON_SECRET`, schedule the sync worker so connected
calendars refresh automatically. A host can already press **"Sync now"** without this — the cron just
automates the periodic pull.

**Note:** Hostinger **Web Apps** (Node.js) have **no Cron Jobs feature** in hPanel — that's only on
shared-hosting/WordPress sites. So schedule it from Supabase instead:

**Recommended — Supabase `pg_cron` (`supabase/calendar-cron.sql`).** Fill your `CRON_SECRET` into that
file and run it once in the SQL Editor. It enables `pg_cron` + `pg_net` and schedules a POST to the
worker every 5 minutes. Check runs with `select * from cron.job_run_details order by start_time desc;`.

**Alternatives:** a free external pinger like **cron-job.org** (POST the URL every 5 min with header
`Authorization: Bearer <secret>`), or the Cron Jobs on your **shared-hosting** site (e.g. the
WordPress site) running `curl -fsS -X POST -H "Authorization: Bearer <secret>"
https://ghbucketlist.com/api/cron/sync-calendars` — the curl just makes an HTTP call, so it works
from any host.

**Sync speed (set expectations with hosts):** inbound (Booking.com → GHBucketlist) refreshes within
your cron interval (~5 min); outbound (GHBucketlist → Booking.com) is on **Booking.com's** schedule
(a few hours) and cannot be sped up with iCal. Real-time both ways needs a paid channel manager.

### Host guide — "Connect Booking.com" (for support to share)
On **Dashboard → My Properties → Calendar sync** for a listing:
1. **Bring Booking.com in:** in the Booking.com extranet go to **Calendar → Sync calendars → Export**,
   copy the link (ends in `.ics`), paste it into the GHBucketlist field, choose source **Booking.com**,
   click **Add calendar**, then **Sync now**. Dates booked on Booking.com now show unavailable here.
2. **Send GHBucketlist out:** copy the **export link** shown on the same page and paste it into
   Booking.com under **Calendar → Sync calendars → Import**. Bookings made on GHBucketlist now block
   those dates on Booking.com too.

Phase 1 covers **stays** (whole-unit). Hotel room-type-level feeds can be added later via `?unit=`.

## 6. Already done / not needed
- **Image optimization** — `next.config.ts` sets `images.unoptimized: true`, so there is no
  `sharp` native dependency to install on Hostinger; images pass straight through.
- **No `output: export`** — intentionally; the app must stay a running Node server.

## 6. Smoke test after deploy
- Home page loads.
- A stay/car/activity/service **detail page** loads (proves server rendering + Supabase reads work).
- Visiting `/dashboard/user` while signed out redirects to `/login` (proves middleware runs).
- After running `admin.sql` and promoting an admin account: `/dashboard/admin` loads and the Users
  tab lists real accounts (proves the admin RPCs/RLS work).
