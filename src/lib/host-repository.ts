import { hosts } from "@/data/hosts";
import { experiences } from "@/data/experiences";
import { properties } from "@/data/properties";
import { hostBookings } from "@/data/host-bookings";
import { useBookings } from "@/lib/bookings-store";
import { useStayBookings } from "@/lib/stay-bookings-store";
import { useHostCreatedExperiences } from "@/lib/host-experiences-store";
import { useHostCreatedProperties } from "@/lib/host-properties-store";
import type { HostBooking } from "@/lib/host-types";

export const CURRENT_HOST_ID = "host-kwabena";

export function getCurrentHost() {
  return hosts.find((h) => h.id === CURRENT_HOST_ID)!;
}

export function getHostExperiences() {
  return experiences.filter((e) => e.hostId === CURRENT_HOST_ID);
}

export function getHostExperienceIds() {
  return getHostExperiences().map((e) => e.id);
}

export function getHostExperience(experienceId: string) {
  return experiences.find((e) => e.id === experienceId && e.hostId === CURRENT_HOST_ID);
}

/**
 * Combines the static demo listings with any experiences this browser has created or
 * edited for the host. A store entry with the same id as a static one is an edit override
 * and replaces it in place, rather than appearing as a duplicate.
 */
export function useHostExperiences() {
  const created = useHostCreatedExperiences().filter((e) => e.hostId === CURRENT_HOST_ID);
  const overrideIds = new Set(created.map((e) => e.id));
  const staticOnes = getHostExperiences().filter((e) => !overrideIds.has(e.id));
  return [...created, ...staticOnes];
}

export function useHostExperienceIds() {
  return useHostExperiences().map((e) => e.id);
}

export function getHostProperties() {
  return properties.filter((p) => p.hostId === CURRENT_HOST_ID);
}

/** Same static+override merge pattern as useHostExperiences, for Stay listings. */
export function useHostProperties() {
  const created = useHostCreatedProperties().filter((p) => p.hostId === CURRENT_HOST_ID);
  const overrideIds = new Set(created.map((p) => p.id));
  const staticOnes = getHostProperties().filter((p) => !overrideIds.has(p.id));
  return [...created, ...staticOnes];
}

/** Combines static demo stay bookings with any live bookings made for the host's own properties. */
export function useHostStayBookings() {
  const liveBookings = useStayBookings();
  const propertyIds = useHostProperties().map((p) => p.id);
  return liveBookings.filter((b) => propertyIds.includes(b.propertyId));
}

/** Combines static demo bookings with any live bookings this browser made for the host's own experiences. */
export function useHostBookings(): HostBooking[] {
  const liveBookings = useBookings();
  const hostExpIds = useHostExperienceIds();

  const fromLive: HostBooking[] = liveBookings
    .filter((b) => hostExpIds.includes(b.experienceId) && !b.isGift)
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

  return [...hostBookings, ...fromLive].sort(
    (a, b) => new Date(b.dateISO).getTime() - new Date(a.dateISO).getTime()
  );
}

export function platformFee(gross: number) {
  return gross * 0.05;
}

export function netPayout(gross: number) {
  return gross - platformFee(gross);
}
