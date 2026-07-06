import { hosts } from "@/data/hosts";
import { experiences } from "@/data/experiences";
import { properties } from "@/data/properties";
import { hostBookings } from "@/data/host-bookings";
import { useBookings } from "@/lib/bookings-store";
import { useStayBookings } from "@/lib/stay-bookings-store";
import { useHostCreatedExperiences } from "@/lib/host-experiences-store";
import { useHostCreatedProperties } from "@/lib/host-properties-store";
import { useAuth } from "@/lib/auth-context";
import type { HostBooking } from "@/lib/host-types";
import type { Host } from "@/lib/types";

/** Fallback used only when no one is signed in (dashboard routes require auth, so this is mostly defensive). */
const DEMO_HOST_ID = "host-kwabena";

/** The signed-in host's id — real listings/bookings/payouts are all scoped to this. */
export function useCurrentHostId() {
  const { user } = useAuth();
  return user?.id ?? DEMO_HOST_ID;
}

/** Display info (name/avatar/bio) for the signed-in host, for sidebar/header UI. */
export function useCurrentHost(): Host {
  const { user, profile } = useAuth();
  if (!user) return hosts.find((h) => h.id === DEMO_HOST_ID)!;

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
