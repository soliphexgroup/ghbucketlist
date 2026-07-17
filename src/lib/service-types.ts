export type ServiceCategory = "carpenter" | "electrician" | "plumber" | "cleaner" | "welder";

export type ServiceProvider = {
  id: string;
  slug: string;
  name: string;
  category: ServiceCategory;
  avatarUrl: string;
  portfolioImages: string[];
  bio: string;
  city: string;
  serviceArea: string;
  yearsExperience: number;
  hourlyRate: number;
  verified: boolean;
  responseTimeMinutes: number;
  /**
   * Full English weekday names the provider takes jobs on, e.g. ["Monday", "Tuesday"].
   * Matched against a searched date's weekday. Note this is which days they work, not
   * a calendar — nothing records whether they're already booked on a given date.
   */
  workingDays: string[];
  completedJobs: number;
  skills: string[];
  rating: number;
  reviewCount: number;
  createdAt: string;
};
