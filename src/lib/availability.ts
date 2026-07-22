// Shared availability primitives used by every vertical's availability module (stays,
// cars, …). Ranges are ISO `YYYY-MM-DD`, checkout/return-exclusive: the `end` day is
// the day you leave, not an occupied night.

/** An ISO `YYYY-MM-DD` date range, end-exclusive. */
export type DateRange = { start: string; end: string };

/**
 * Two end-exclusive ranges overlap iff each starts before the other ends. ISO
 * `YYYY-MM-DD` strings compare correctly with `<`, so no Date parsing is needed.
 */
export function rangesOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string) {
  return aStart < bEnd && bStart < aEnd;
}

/** A single night (its ISO date) falls inside an end-exclusive range. */
export function nightInRange(nightISO: string, range: DateRange) {
  return range.start <= nightISO && nightISO < range.end;
}

/** `Date` → local `YYYY-MM-DD` (not UTC, which can shift the day). */
export function toISODate(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Whether a calendar day should be disabled given a set of blocked ranges. */
export function isNightBlocked(date: Date, ranges: DateRange[]) {
  const iso = toISODate(date);
  return ranges.some((range) => nightInRange(iso, range));
}
