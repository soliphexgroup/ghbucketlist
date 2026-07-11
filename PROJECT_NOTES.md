# GH Bucketlist — Project Notes

Portable working notes for the `gaderin` repo (GH Bucketlist marketplace platform). This file is git-tracked, so pulling/cloning this repo on any machine brings it with you.

Last updated: 2026-07-10

---

## 1. Stack

- Next.js 16 (App Router) — **note:** this fork renamed `middleware.ts` → `proxy.ts` (exported function is `proxy`, not `middleware`). Read `node_modules/next/dist/docs/` before assuming training-data APIs still apply.
- React 19, TypeScript
- Tailwind CSS v4 — theme lives entirely in `src/app/globals.css`'s `@theme inline` block + `:root`/`.dark` variables. There is **no `tailwind.config.js`**.
- shadcn/ui (`radix-nova` style, base color `neutral`) + Radix primitives directly + `@base-ui/react`
- `lucide-react` icons, `framer-motion` (added for hero/tab animations)
- `class-variance-authority` + `tailwind-merge` via `cn()` in `src/lib/utils`
- Supabase (Auth + Postgres) for real backend — see section 4
- Paystack (Inline JS v2) for payments — wired up, never verified against real test keys
- `next/image` configured `unoptimized: true` — renders plain `<img>` tags, no `/next/image` proxy

## 2. Design system (current, post-redesign as of 2026-07-10)

The client requested a booking.com-style redesign (reference screenshots + a live URL were provided), reskinned in **green**, not booking.com's navy/yellow.

**Colors (light mode):**
- Primary: `#059669` (emerald green) — used consistently everywhere, no separate accent color for CTAs
- Hero/header gradient (3-stop diagonal): `#006B3C → #0D7A43 → #1F9D55` (`--brand-primary-gradient-from/via/to`)
- Search bar: gold border `#FFB700` (`--search-accent`), dark-green submit button `#0A7A3F` (`--search-button`)
- Dark mode (`.dark` class): swaps primary to coral `#e8703a`, wine/maroon background `#17090f`, not a simple invert

**Shape:** the whole radius scale was compressed to a "near-rectangular" look per client request — `--radius-sm/md/lg/xl/2xl/3xl/4xl` are now multipliers of the base `--radius` (0.9rem) in the 0.55–0.95 range (down from 0.6–2.6). This was **one token edit in `globals.css`**, cascading to every `rounded-*` usage site-wide — the dominant card radius (`rounded-2xl`) now renders at ~11.5px instead of ~26px.

**Layout:** redesigned sections/pages commonly use `Container` with `className="max-w-[64rem] lg:px-6"` (narrower than the original `max-w-7xl` default) so header, tabs, hero text, and section content all share one consistent left edge. Section vertical padding was tightened (`py-16/20` → `py-8/10` typical) across the homepage.

## 3. Hero/tabs architecture

- **`VerticalHero`** (`src/components/vertical-hero.tsx`) — shared hero used by every vertical: gradient background, `ServiceTabsBar` (route-mode; tabs navigate between real pages), headline/subheading (subheading optional via prop), `SearchWidget` (optional via `showSearch`).
- **`src/lib/service-tabs.ts`** — single source of truth for the 5 service tabs, their routes, `getActiveServiceTab(pathname)`, and `PAGES_WITH_OWN_HERO` (pages rendering their own hero+tabs must be listed here or the header's route-tabs row duplicates them).
- Each vertical is its own real route: `/` (Stays), `/date-experiences`, `/activities` (Things to Do), `/cars`, `/services`. Tabs always navigate to a real page — there is no local-state tab switcher anymore.
- Search bar (`src/components/home/search-widget.tsx`) has per-tab field sets. Stays uses a real neighbourhood-picker dropdown (`listPropertyNeighbourhoods()` from `stay-repository.ts`) and a booking.com-style Adults/Children/Rooms/Pets popover that defaults to 0/0/0 (not a pre-filled guess).

## 4. "At a glance" category drill-down pattern

Things to Do, Date Experiences, Car Rentals, and Handyman Services all replaced their default "Showing N results" flat listing with a **photo-tile grid of real categories/vehicle-types/service-types** (matching Stay's "Browse by property type" pattern). Tapping a tile drills into the existing filtered browser view.

Each `*-landing.tsx` component follows the same shape: show the tile grid when no filter is present in the URL, otherwise render the real filtered browser component (`*-browser.tsx`).

**Every tile must map to a category/location that actually has real data behind it** — see section 6.

## 5. Supabase Auth

- Real Supabase Auth (Postgres), not a mock. Client/server helpers in `src/lib/supabase/client.ts` and `server.ts`.
- Roles (`customer` | `host` | `admin`) live in a separate `profiles` table (not user_metadata alone, to prevent self-escalation) — see `supabase/migration.sql` in the repo for the exact schema, RLS policies, and the `handle_new_user()` trigger that populates `profiles` from signup metadata.
- **No self-serve admin signup** — promoting a user to admin requires manually running SQL in the Supabase dashboard's SQL Editor (the exact snippet is at the bottom of `supabase/migration.sql`).
- No direct Supabase MCP/tool integration is available in this environment — SQL migrations must be run manually by the user via Supabase's own SQL Editor; there's no way to execute DDL against the project programmatically from this session.
- Vercel serverless functions have an ephemeral, read-only filesystem — ruled out any "store data in a local JSON file" approach for backend features.

## 6. Recurring constraint: real data only

The client's reference materials (booking.com screenshots) repeatedly showed content GH Bucketlist's actual data doesn't support — e.g. "Trending destinations" showed Dubai/London/Toronto; the trip-planner reference showed cities across all of Ghana (Cape Coast, Ho, Elmina, Takoradi, Koforidua) plus a "Markets & Shopping" category. **None of that exists in the real experience/property data**, which only covers Accra-area neighbourhoods (Osu, Ridge, Jamestown, Cantonments, East Legon, Aburi, Adabraka, Labone, Airport Residential, Tesano) across a fixed set of real categories.

Every time this came up, the fix was to substitute real neighbourhoods/categories for the reference's placeholder content, never to fabricate data. Confirmed as the right call every time — **treat this as a hard rule**, not a one-off judgment call. Before building any "browse by X" or "trending Y" section, check the actual data layer (`src/data/*.ts`, `*-repository.ts`) for what's real first.

## 7. Known bug class: "dead param" filters

Found this exact bug **three separate times** in one session: a search widget would send a URL param (e.g. `location=`, `q=`) that the destination browser component's `initialFilters`/`FilterState` never actually read — so the filter silently did nothing despite the URL looking correct. Happened with Stay, and would have with Activities/Cars/Services too if not checked.

**Rule:** whenever wiring a new field in `search-widget.tsx` (or any search UI) to an existing browser component, verify the destination `*-browser.tsx` component actually reads and applies that exact URL param — don't assume `router.push` with the right query string means the filter is live. Test it live, not just visually.

## 8. React pattern: avoid `set-state-in-effect`

This project's ESLint config enforces `react-hooks/set-state-in-effect`. For anything that needs to sync derived/draft state each time it "opens" (a popover editor, a form pre-filled from async data), don't use `useEffect` + `setState` in the parent. Instead:

- Extract the stateful part into a child component that only mounts while active: `{open && <Editor initial={value} onDone={...} />}`
- Let it initialize via a lazy `useState(initial)` — no effect needed, since a fresh mount naturally reads current props.

Same idea as the "remount via key" pattern used earlier in the project for edit-mode forms (`key={existing?.id ?? "new"}`).

## 9. Verification workflow

After every code change: `npx tsc --noEmit` → `npx eslint src --max-warnings=0` → `npm run build` → verify live in the browser preview (not just visually — check computed styles/DOM state via the browser tools, test real interactions, confirm URLs/filters actually work end to end).

**Gotcha:** don't run `npm run build` while the dev preview server is still running against the same `.next` directory — they race and corrupt `.next/dev/types` or `.next/types`, producing a spurious "Unterminated regular expression literal" TypeScript error that looks like a real bug but isn't. Stop the preview server (or delete `.next`) before a clean build check if this happens.

## 10. What shipped in the redesign (2026-07-06 → 2026-07-10)

- Shared `VerticalHero` + tab-driven navigation across all 5 verticals, each its own real route
- New dedicated `/date-experiences` page (previously a `?category=arts-culture` variant of `/activities`)
- Category/vehicle/service-type drill-down grids for Things to Do, Date Experiences, Car Rentals, Handyman Services
- Rebuilt homepage search bar: real-neighbourhood dropdown + Adults/Children/Rooms/Pets popover
- Homepage trimmed (removed Explore Verticals, Browse by Category, How It Works, Points Banner, Testimonials, Blog); added "Why GH Bucketlist" and "Quick and easy trip planner"
- Header polish: removed placeholder "USD", fixed invisible Register button, host CTAs gated behind signup for logged-out users
- Global corner-radius token compressed to a near-rectangular look site-wide

## 11. Still open / not yet done

- Cars and Handyman Services still lack host/vendor-side listing management (Add/Edit), unlike Stays and Things to Do
- Customer-side data (bookings, wishlist, reviews) is still per-browser localStorage, not tied to the real Supabase account
- If the fuller Ghana-wide version of the trip-planner/trending-destinations sections is wanted (real cities beyond Accra), that needs new seed data first
- Real Paystack test keys were never provided — payment integration is wired but unverified end-to-end against a live key
- Two pre-migration test Supabase accounts (`testhost2`, `testhost3.ghb@gmail.com`) have no `profiles` row and should be deleted from the Supabase dashboard
