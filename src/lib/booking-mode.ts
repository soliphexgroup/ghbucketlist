/**
 * Platform-wide booking mode switch.
 *
 * "Request to Book" doesn't collect payment yet (there's no accept-and-charge step), so while it's
 * unfinished every booking goes through the INSTANT path — the guest pays upfront via Paystack.
 * This forces instant behaviour for ALL listings, including any already stored as "request", so no
 * booking can slip through unpaid.
 *
 * To re-enable per-listing Request to Book later: set this to false and restore the booking-type
 * selector in the host forms (guarded by this flag).
 */
export const INSTANT_BOOK_ONLY = true;

/** Whether a booking should use the instant (pay-upfront) flow, honouring the platform switch. */
export function isInstantBooking(bookingType?: string | null): boolean {
  return INSTANT_BOOK_ONLY || bookingType === "instant";
}
