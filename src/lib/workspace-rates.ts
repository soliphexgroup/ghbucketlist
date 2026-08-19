import { addDays, addWeeks, addMonths, addHours } from "date-fns";
import type { Experience, RateUnit, WorkspaceRate } from "@/lib/types";

/**
 * Pricing + span helpers for "Rent a workspace" listings. The whole model reduces a rate
 * (unit + count) to a real occupancy span [start, end), which the existing date-range
 * availability engine (dbSeatsLeft) already understands. See src/lib/db-availability.ts.
 */

/** Whether an experience is a workspace rental (has a rate card) rather than a normal activity. */
export function isWorkspace(e: Experience): boolean {
  return !!e.workspaceRates && e.workspaceRates.length > 0;
}

const UNIT_LABEL: Record<RateUnit, { one: string; many: string }> = {
  hour: { one: "hour", many: "hours" },
  day: { one: "day", many: "days" },
  week: { one: "week", many: "weeks" },
  month: { one: "month", many: "months" },
};

/** "day" / "days" for a given count. */
export function rateUnitLabel(unit: RateUnit, count = 1): string {
  return count === 1 ? UNIT_LABEL[unit].one : UNIT_LABEL[unit].many;
}

/** The "/ day" suffix shown next to a price. */
export function rateUnitSuffix(unit: RateUnit): string {
  return UNIT_LABEL[unit].one;
}

/**
 * End of the occupancy span for `count` units of `unit` starting at `start`. End-exclusive,
 * matching the platform's checkout-exclusive range convention. Months are calendar months
 * (Jan 15 → Feb 15), not a flat 30 days.
 */
export function spanEnd(start: Date, unit: RateUnit, count: number): Date {
  switch (unit) {
    case "hour":
      return addHours(start, count);
    case "day":
      return addDays(start, count);
    case "week":
      return addWeeks(start, count);
    case "month":
      return addMonths(start, count);
  }
}

/** subtotal = price × duration units × desks. Fees are layered on top by the caller. */
export function workspaceSubtotal(rate: WorkspaceRate, count: number, desks: number): number {
  return rate.price * count * desks;
}

/** Cheapest rate in a card, for a "from ₵X / unit" headline price. */
export function cheapestRate(rates: WorkspaceRate[]): WorkspaceRate | undefined {
  return rates.slice().sort((a, b) => a.price - b.price)[0];
}

/**
 * Rates offered for online booking today. Phase 1 excludes hourly, which needs time-of-day
 * slot selection the date-range engine can't express yet (Phase 2).
 */
export function bookableRates(rates: WorkspaceRate[]): WorkspaceRate[] {
  return rates.filter((r) => r.unit !== "hour");
}
