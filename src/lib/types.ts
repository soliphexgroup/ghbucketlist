export type Category = {
  id: string;
  name: string;
  slug: string;
  icon: string;
  colorHex: string;
  description: string;
};

export type Host = {
  id: string;
  slug: string;
  name: string;
  avatarUrl: string;
  bio: string;
  joinedYear: number;
  rating: number;
  reviewCount: number;
};

export type TicketType = {
  id: string;
  name: string;
  priceGHS: number;
  description?: string;
};

/** A rate unit for "Rent a workspace" listings. "hour" is Phase 2 (needs time-of-day). */
export type RateUnit = "hour" | "day" | "week" | "month";

/** One tier of a workspace rate card: a price per unit, per desk. */
export type WorkspaceRate = {
  unit: RateUnit;
  price: number;
  /** Minimum units bookable at this rate (e.g. 2 hours). Defaults to 1. */
  minQty?: number;
  maxQty?: number;
};

export type Experience = {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  description: string;
  categoryId: string;
  hostId: string;
  images: string[];
  venueName: string;
  neighbourhood: string;
  city: string;
  durationMinutes: number;
  maxCapacity: number;
  minAttendees: number;
  isFree: boolean;
  acceptsDonations: boolean;
  ticketTypes: TicketType[];
  /**
   * Present (non-empty) ⇒ this is a "Rent a workspace" listing: booked by rate span
   * (day/week/month) rather than by ticketTypes on a single scheduled session.
   */
  workspaceRates?: WorkspaceRate[];
  /** Workspace only: sell `maxCapacity` as individual desks (true) or as the whole room (false/absent). */
  deskBased?: boolean;
  scheduleDays: string[];
  scheduleTime: string;
  /** "recurring" (weekly, the default) or "dates" (specific one-off event dates). */
  scheduleType?: "recurring" | "dates";
  /** scheduleType "dates" only: the specific ISO `YYYY-MM-DD` dates the event runs. */
  eventDates?: string[];
  /**
   * Seeded fiction (not live data): specific ISO dates this experience's session is full,
   * beyond the weekday schedule. Capacity isn't seat-counted, so a sold-out date is modelled
   * as a whole-day block rather than a running tally.
   */
  unavailableDates?: string[];
  whatsIncluded: string[];
  gpPoints: number;
  rating: number;
  reviewCount: number;
  visibility: "public" | "private";
  createdAt: string;
};

export type Review = {
  id: string;
  experienceId: string;
  userName: string;
  userAvatar: string;
  rating: number;
  text: string;
  date: string;
};

export type Testimonial = {
  id: string;
  name: string;
  location: string;
  avatarUrl: string;
  rating: number;
  text: string;
  activityName: string;
};

export type BlogPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string[];
  coverImage: string;
  author: string;
  date: string;
  readTime: string;
  category: string;
};
