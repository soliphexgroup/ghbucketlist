import { allPlatformBookings } from "@/data/admin-bookings";
import { useBookings } from "@/lib/bookings-store";
import type { HostBooking } from "@/lib/host-types";

/** Combines static demo bookings across every host with any live bookings made in this browser. */
export function useAllPlatformBookings(): HostBooking[] {
  const liveBookings = useBookings();

  const fromLive: HostBooking[] = liveBookings
    .filter((b) => !b.isGift)
    .map((b) => ({
      id: b.reference,
      experienceId: b.experienceId,
      guestName: "You (this device)",
      guestEmail: "you@example.com",
      guestAvatar: "https://i.pravatar.cc/100?img=68",
      dateISO: b.dateISO,
      scheduleTime: b.scheduleTime,
      ticketTypeName: b.ticketTypeName,
      quantity: b.quantity,
      total: b.total,
      status:
        b.status === "cancelled"
          ? "cancelled"
          : new Date(b.dateISO) < new Date()
            ? "attended"
            : "confirmed",
      checkedIn: false,
      createdAtISO: b.createdAtISO,
    }));

  return [...allPlatformBookings, ...fromLive].sort(
    (a, b) => new Date(b.createdAtISO).getTime() - new Date(a.createdAtISO).getTime()
  );
}
