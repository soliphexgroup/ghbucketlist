import { useState } from "react";
import { hosts } from "@/data/hosts";
import { experiences, getExperienceById } from "@/data/experiences";
import { properties } from "@/data/properties";
import { cars } from "@/data/cars";
import { hostBookings } from "@/data/host-bookings";
import { hostStayBookings } from "@/data/host-stay-bookings";
import { hostCarBookings } from "@/data/host-car-bookings";
import { useBookings } from "@/lib/bookings-store";
import { useStayBookings, type StoredStayBooking } from "@/lib/stay-bookings-store";
import { useCarBookings, type StoredCarBooking } from "@/lib/car-bookings-store";
import { useHostCreatedExperiences } from "@/lib/host-experiences-store";
import { useHostCreatedProperties } from "@/lib/host-properties-store";
import { useHostCreatedCars } from "@/lib/host-cars-store";
import { useDemoHostPreview } from "@/lib/demo-host-preview";
import { useAuth } from "@/lib/auth-context";
import type { Car } from "@/lib/car-types";
import type { HostBooking, HostLedgerEntry, HostLedgerStatus } from "@/lib/host-types";
import type { Host } from "@/lib/types";

const GUEST_FALLBACK_AVATAR = "https://i.pravatar.cc/100?img=68";

/** Fallback used only when no one is signed in (dashboard routes require auth, so this is mostly defensive). */
const DEMO_HOST_ID = "host-kwabena";

/** The signed-in host's id — real listings/bookings/payouts are all scoped to this. */
export function useCurrentHostId() {
  const { user } = useAuth();
  const preview = useDemoHostPreview();
  if (preview) return DEMO_HOST_ID;
  return user?.id ?? DEMO_HOST_ID;
}

/** Display info (name/avatar/bio) for the signed-in host, for sidebar/header UI. */
export function useCurrentHost(): Host {
  const { user, profile } = useAuth();
  const preview = useDemoHostPreview();
  if (preview || !user) return hosts.find((h) => h.id === DEMO_HOST_ID)!;

  const staticMatch = hosts.find((h) => h.id === user.id);
  if (staticMatch) return staticMatch;

  return {
    id: user.id,
    slug: user.id,
    name: profile?.full_name || user.email || "Host",
    avatarUrl: profile?.avatar_url || "https://i.pravatar.cc/150?img=1",
    bio: "",
    joinedYear: new Date(user.created_at).getFullYear(),
    rating: 0,
    reviewCount: 0,
  };
}

function getHostExperiences(hostId: string) {
  return experiences.filter((e) => e.hostId === hostId);
}

/**
 * Combines the static demo listings with any experiences this browser has created or
 * edited for the host. A store entry with the same id as a static one is an edit override
 * and replaces it in place, rather than appearing as a duplicate.
 */
export function useHostExperiences() {
  const hostId = useCurrentHostId();
  const created = useHostCreatedExperiences().filter((e) => e.hostId === hostId);
  const overrideIds = new Set(created.map((e) => e.id));
  const staticOnes = getHostExperiences(hostId).filter((e) => !overrideIds.has(e.id));
  return [...created, ...staticOnes];
}

export function useHostExperienceIds() {
  return useHostExperiences().map((e) => e.id);
}

function getHostProperties(hostId: string) {
  return properties.filter((p) => p.hostId === hostId);
}

/** Same static+override merge pattern as useHostExperiences, for Stay listings. */
export function useHostProperties() {
  const hostId = useCurrentHostId();
  const created = useHostCreatedProperties().filter((p) => p.hostId === hostId);
  const overrideIds = new Set(created.map((p) => p.id));
  const staticOnes = getHostProperties(hostId).filter((p) => !overrideIds.has(p.id));
  return [...created, ...staticOnes];
}

/** A car's vendor is a host, so the host's own cars are those with vendorId === their id. */
function getHostCars(hostId: string) {
  return cars.filter((c) => c.vendorId === hostId);
}

/** Same static+override merge pattern, for Car listings. */
export function useHostCars(): Car[] {
  const hostId = useCurrentHostId();
  const created = useHostCreatedCars().filter((c) => c.vendorId === hostId);
  const overrideIds = new Set(created.map((c) => c.id));
  const staticOnes = getHostCars(hostId).filter((c) => !overrideIds.has(c.id));
  return [...created, ...staticOnes];
}

/** Combines seeded demo stay bookings with any live bookings made for the host's own properties. */
export function useHostStayBookings(): StoredStayBooking[] {
  const liveBookings = useStayBookings();
  const propertyIds = new Set(useHostProperties().map((p) => p.id));

  const live = liveBookings.filter((b) => propertyIds.has(b.propertyId));
  const liveRefs = new Set(live.map((b) => b.reference));
  const seeded = hostStayBookings.filter(
    (b) => propertyIds.has(b.propertyId) && !liveRefs.has(b.reference)
  );

  return [...seeded, ...live].sort(
    (a, b) => new Date(b.checkInISO).getTime() - new Date(a.checkInISO).getTime()
  );
}

/** Whether a stay counts as earned revenue: checked out (or explicitly completed), not cancelled. */
function stayLedgerStatus(booking: StoredStayBooking, now: number): HostLedgerStatus {
  if (booking.status === "cancelled" || booking.status === "declined") return "cancelled";
  if (booking.status === "pending_request") return "pending";
  if (booking.status === "completed" || new Date(booking.checkOutISO).getTime() < now) return "completed";
  return "confirmed";
}

/** Combines seeded demo car bookings with any live bookings made for the host's own cars. */
export function useHostCarBookings(): StoredCarBooking[] {
  const liveBookings = useCarBookings();
  const carIds = new Set(useHostCars().map((c) => c.id));

  const live = liveBookings.filter((b) => carIds.has(b.carId));
  const liveRefs = new Set(live.map((b) => b.reference));
  const seeded = hostCarBookings.filter((b) => carIds.has(b.carId) && !liveRefs.has(b.reference));

  return [...seeded, ...live].sort(
    (a, b) => new Date(b.pickupDateISO).getTime() - new Date(a.pickupDateISO).getTime()
  );
}

/** Whether a rental counts as earned revenue: returned (or explicitly completed), not cancelled. */
function carLedgerStatus(booking: StoredCarBooking, now: number): HostLedgerStatus {
  if (booking.status === "cancelled" || booking.status === "declined") return "cancelled";
  if (booking.status === "pending_request") return "pending";
  if (booking.status === "completed" || new Date(booking.returnDateISO).getTime() < now) return "completed";
  return "confirmed";
}

/**
 * Experiences and stays, normalized into one list so the dashboard's totals, activity feeds
 * and tables can treat them uniformly. Sorted most-recent first by the entry's date.
 */
export function useHostLedger(): HostLedgerEntry[] {
  const experienceBookings = useHostBookings();
  const stayBookings = useHostStayBookings();
  const carBookings = useHostCarBookings();
  // Computed once per mount so the render stays pure (a "completed" depends on now).
  const [now] = useState(() => Date.now());

  const fromExperiences: HostLedgerEntry[] = experienceBookings.map((b) => ({
    id: b.id,
    kind: "experience",
    listingId: b.experienceId,
    listingTitle: getExperienceById(b.experienceId)?.title ?? "Experience",
    guestName: b.guestName,
    guestEmail: b.guestEmail,
    guestAvatar: b.guestAvatar,
    dateISO: b.dateISO,
    detail: `${b.quantity} × ${b.ticketTypeName}`,
    gross: b.total,
    status:
      b.status === "cancelled" || b.status === "refunded"
        ? "cancelled"
        : b.status === "attended"
          ? "completed"
          : "confirmed",
    createdAtISO: b.createdAtISO,
  }));

  const fromStays: HostLedgerEntry[] = stayBookings.map((b) => ({
    id: b.reference,
    kind: "stay",
    listingId: b.propertyId,
    listingTitle: b.propertyTitle,
    guestName: b.guestName ?? "You (this device)",
    guestEmail: b.guestEmail ?? "",
    guestAvatar: b.guestAvatar ?? GUEST_FALLBACK_AVATAR,
    dateISO: b.checkInISO,
    endISO: b.checkOutISO,
    detail: `${b.nights} night${b.nights === 1 ? "" : "s"} · ${b.rooms ?? 1} room${(b.rooms ?? 1) === 1 ? "" : "s"}`,
    gross: b.total,
    status: stayLedgerStatus(b, now),
    createdAtISO: b.createdAtISO,
  }));

  const fromCars: HostLedgerEntry[] = carBookings.map((b) => ({
    id: b.reference,
    kind: "car",
    listingId: b.carId,
    listingTitle: b.carTitle,
    guestName: b.guestName ?? "You (this device)",
    guestEmail: b.guestEmail ?? "",
    guestAvatar: b.guestAvatar ?? GUEST_FALLBACK_AVATAR,
    dateISO: b.pickupDateISO,
    endISO: b.returnDateISO,
    detail: `${b.days} day${b.days === 1 ? "" : "s"} · ${b.withDriver ? "with driver" : "self-drive"}`,
    gross: b.total,
    status: carLedgerStatus(b, now),
    createdAtISO: b.createdAtISO,
  }));

  return [...fromExperiences, ...fromStays, ...fromCars].sort(
    (a, b) => new Date(b.dateISO).getTime() - new Date(a.dateISO).getTime()
  );
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

  const staticForHost = hostBookings.filter((b) => hostExpIds.includes(b.experienceId));

  return [...staticForHost, ...fromLive].sort(
    (a, b) => new Date(b.dateISO).getTime() - new Date(a.dateISO).getTime()
  );
}

export function platformFee(gross: number) {
  return gross * 0.05;
}

export function netPayout(gross: number) {
  return gross - platformFee(gross);
}
