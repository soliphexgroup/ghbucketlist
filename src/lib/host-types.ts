export type HostBookingStatus = "confirmed" | "attended" | "cancelled" | "refunded";

/** Normalized so the dashboard can total and list experiences and stays together. */
export type HostLedgerKind = "experience" | "stay" | "car";
export type HostLedgerStatus = "pending" | "confirmed" | "completed" | "cancelled";

export type HostLedgerEntry = {
  id: string;
  kind: HostLedgerKind;
  /** experienceId or propertyId, for linking back to the listing. */
  listingId: string;
  listingTitle: string;
  guestName: string;
  guestEmail: string;
  guestAvatar: string;
  /** Experience session date, or a stay's check-in. */
  dateISO: string;
  /** A stay's check-out (absent for experiences). */
  endISO?: string;
  /** Kind-specific line, e.g. "2 × General" or "3 nights · 1 room". */
  detail: string;
  gross: number;
  status: HostLedgerStatus;
  createdAtISO: string;
};

export type HostBooking = {
  id: string;
  experienceId: string;
  guestName: string;
  guestEmail: string;
  guestAvatar: string;
  dateISO: string;
  scheduleTime: string;
  ticketTypeName: string;
  quantity: number;
  total: number;
  status: HostBookingStatus;
  checkedIn: boolean;
  createdAtISO: string;
};
