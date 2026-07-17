// Date helpers shared by the stay search, listing and booking surfaces.

export function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function startOfToday() {
  return new Date(new Date().setHours(0, 0, 0, 0));
}

/** At least 1, so a same-day range still prices as one night. */
export function nightsBetween(from: Date, to: Date) {
  return Math.max(1, Math.round((to.getTime() - from.getTime()) / 86_400_000));
}

/** Parse a `YYYY-MM-DD` param as a local date — `new Date(s)` would read it as UTC. */
export function parseDateParam(value: string | null) {
  if (!value) return undefined;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) return undefined;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

// Schedules are stored as full English weekday names, so index them directly rather
// than going through a locale that might spell them differently.
const WEEKDAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

/** "2026-07-17" → "Friday", matching the names used in schedule/working-day data. */
export function weekdayFromISODate(iso: string) {
  const date = parseDateParam(iso);
  return date ? WEEKDAY_NAMES[date.getDay()] : undefined;
}

/** Whole days between two dates, at least 1 — a rental or stay always spans one. */
export function daysBetween(from: Date, to: Date) {
  return nightsBetween(from, to);
}

/**
 * The dates a booking surface should open with: the searched range when it's valid,
 * otherwise a default stay that respects the property's minimum nights.
 */
export function resolveStayRange({
  checkIn,
  checkOut,
  minNights,
  fallbackLeadDays = 7,
}: {
  checkIn?: Date;
  checkOut?: Date;
  minNights: number;
  fallbackLeadDays?: number;
}) {
  const from = checkIn ?? addDays(new Date(), fallbackLeadDays);
  const earliest = addDays(from, minNights);
  const to = checkOut && checkOut > from && nightsBetween(from, checkOut) >= minNights ? checkOut : earliest;
  return { from, to };
}
