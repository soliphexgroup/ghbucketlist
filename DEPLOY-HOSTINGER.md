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

`NEXT_PUBLIC_*` vars are inlined at **build time**, so if you change them you must rebuild.

## 3. Domain + Supabase URLs (do after the app is live)
Once the app answers on its Hostinger domain (e.g. `https://ghbucketlist.com`):

1. Point your domain at the Hostinger app.
2. In **Supabase → Authentication → URL Configuration**, replace the Vercel URLs:
   - **Site URL:** `https://<your-hostinger-domain>`
   - **Redirect URLs:** `https://<your-hostinger-domain>/reset-password`
   (keep `http://localhost:3010/reset-password` for local testing)

## 4. Database SQL scripts (run in the Supabase SQL Editor, in this order)
Run once per Supabase project. All three are idempotent (safe to re-run).

| Script | Purpose | Status |
|---|---|---|
| `supabase/migration.sql` | Auth: profiles, roles, signup trigger, image storage bucket | already run ✅ |
| `supabase/marketplace.sql` | Listings, bookings, availability, `create_booking` RPC | already run ✅ |
| `supabase/admin.sql` | **Admin dashboard**: `is_admin()`, admin RLS, host applications + approve/decline, payouts, user status, `admin_list_users()` | **run this** 🔴 |
| `supabase/bucket-rewards.sql` | **Bucket Rewards**: partners, members, redemptions + token-gated `br_signup` / `br_lookup_member` / `br_redeem` RPCs | **run this** 🔴 |
| `supabase/reviews.sql` | **Reviews**: reviews table + verified `create_review` RPC + `listing_ratings` view (ratings computed from real reviews) | **run this** 🔴 |

`admin.sql` and `bucket-rewards.sql` depend on `migration.sql` + `marketplace.sql` (and
`bucket-rewards.sql` also needs `is_admin()` from `admin.sql`). Until they're run, the admin
dashboard pages, the `/hosting` application flow, and the `/rewards` Bucket Rewards pages will
error because their tables/RPCs don't exist yet. After running them, promote your own account to
admin:

```sql
update public.profiles set role='admin'
where id=(select id from auth.users where email='<you>');
```

## 5. Already done / not needed
- **Image optimization** — `next.config.ts` sets `images.unoptimized: true`, so there is no
  `sharp` native dependency to install on Hostinger; images pass straight through.
- **No `output: export`** — intentionally; the app must stay a running Node server.

## 6. Smoke test after deploy
- Home page loads.
- A stay/car/activity/service **detail page** loads (proves server rendering + Supabase reads work).
- Visiting `/dashboard/user` while signed out redirects to `/login` (proves middleware runs).
- After running `admin.sql` and promoting an admin account: `/dashboard/admin` loads and the Users
  tab lists real accounts (proves the admin RPCs/RLS work).
