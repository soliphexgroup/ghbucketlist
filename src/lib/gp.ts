import type { StoredBooking } from "@/lib/bookings-store";
import type { StoredReview } from "@/lib/reviews-store";

export const GP_PER_REVIEW = 5;
export const GP_PER_REDEMPTION_UNIT = 100;
export const GHS_PER_REDEMPTION_UNIT = 10;

export function computeGpBalance(bookings: StoredBooking[], reviews: StoredReview[]) {
  const activeBookings = bookings.filter((b) => b.status !== "cancelled");
  const earned = activeBookings.reduce((sum, b) => sum + b.gpEarned, 0);
  const redeemed = activeBookings.reduce((sum, b) => sum + (b.gpRedeemed ?? 0), 0);
  return earned + reviews.length * GP_PER_REVIEW - redeemed;
}

/** Largest GP redemption (in multiples of 100) that doesn't exceed the balance or the order total. */
export function maxRedeemableGp(balance: number, total: number) {
  const byBalance = Math.floor(balance / GP_PER_REDEMPTION_UNIT) * GP_PER_REDEMPTION_UNIT;
  const byTotal = Math.floor(total / GHS_PER_REDEMPTION_UNIT) * GP_PER_REDEMPTION_UNIT;
  return Math.max(0, Math.min(byBalance, byTotal));
}

export function gpToDiscount(gp: number) {
  return (gp / GP_PER_REDEMPTION_UNIT) * GHS_PER_REDEMPTION_UNIT;
}
