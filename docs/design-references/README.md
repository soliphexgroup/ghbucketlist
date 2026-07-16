# Design references

Client-supplied mockups for the mobile redesign, kept so the intent behind the built
UI stays traceable. They are **references, not specs** — where the build deviates, the
reason is recorded below.

## `mobile-hero.jpg`

The mobile homepage hero: green tinted tropical backdrop, two-tone wordmark, headline
and sub-heading, a single rounded search field, and a row of circular category
shortcuts with "Popular" / "New" badges.

Built as `src/components/home/mobile-hero.tsx`, shown under `lg` while the desktop
`VerticalHero` takes over above it. The wordmark is in `src/components/site-header.tsx`.

Since built, the single search field has been replaced per vertical by the stacked
search box below, and it now collapses to a sticky summary bar once a search is
running (`src/components/home/mobile-search-bar.tsx`). The category row still matches.

## `mobile-stay-search-box.jpeg`

The stacked stay search box: amber surround, location field, separate check-in and
check-out fields with the label above a bold value, inline Adults / Children / Rooms,
and a full-width Search button.

Built as `src/components/home/mobile-stay-search.tsx`, sharing its parts with the other
verticals via `src/components/home/mobile-search-fields.tsx`.

**Deliberate deviations:**

- **The Search button is brand green, not blue.** The reference is a Booking.com
  screenshot, and its blue is Booking's. Ours uses `--search-button`, matching the
  desktop widget and the rest of the green palette.
- **"Around current location" is placeholder text, not geolocation.** Tapping the field
  opens the neighbourhood list. Real device geolocation was never in scope.
