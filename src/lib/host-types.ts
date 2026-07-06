export type HostBookingStatus = "confirmed" | "attended" | "cancelled" | "refunded";

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
