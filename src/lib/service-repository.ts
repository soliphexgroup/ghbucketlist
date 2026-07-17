import { serviceProviders } from "@/data/service-providers";
import { serviceCategoryLabels } from "@/data/service-categories";
import { weekdayFromISODate } from "@/lib/dates";
import type { ServiceCategory, ServiceProvider } from "@/lib/service-types";

export type ServiceFilters = {
  q?: string;
  categories?: ServiceCategory[];
  verifiedOnly?: boolean;
  minRating?: number;
  /**
   * ISO `YYYY-MM-DD`. Keeps providers who work that weekday. This is their working
   * days, not a calendar — nothing records whether they're already booked that day.
   */
  date?: string;
  sort?: "recommended" | "rate-asc" | "rate-desc" | "rating" | "response-time";
};

export function listProviders(filters: ServiceFilters = {}): ServiceProvider[] {
  let results = [...serviceProviders];

  if (filters.q) {
    const q = filters.q.toLowerCase();
    results = results.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.serviceArea.toLowerCase().includes(q) ||
        p.bio.toLowerCase().includes(q) ||
        serviceCategoryLabels[p.category].toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.skills.some((s) => s.toLowerCase().includes(q))
    );
  }

  if (filters.categories && filters.categories.length > 0) {
    results = results.filter((p) => filters.categories!.includes(p.category));
  }

  if (filters.verifiedOnly) {
    results = results.filter((p) => p.verified);
  }

  if (filters.minRating) {
    results = results.filter((p) => p.rating >= filters.minRating!);
  }

  if (filters.date) {
    const weekday = weekdayFromISODate(filters.date);
    if (weekday) results = results.filter((p) => p.workingDays.includes(weekday));
  }

  const sort = filters.sort ?? "recommended";
  results.sort((a, b) => {
    if (sort === "rate-asc") return a.hourlyRate - b.hourlyRate;
    if (sort === "rate-desc") return b.hourlyRate - a.hourlyRate;
    if (sort === "rating") return b.rating - a.rating;
    if (sort === "response-time") return a.responseTimeMinutes - b.responseTimeMinutes;
    return b.rating * Math.log(b.reviewCount + 1) - a.rating * Math.log(a.reviewCount + 1);
  });

  return results;
}

export function listServiceCategories(): ServiceCategory[] {
  return Array.from(new Set(serviceProviders.map((p) => p.category)));
}
