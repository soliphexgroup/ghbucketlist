// Data-access seam: every page/component reads through these functions instead of
// importing mock arrays directly, so swapping to a real database later (Supabase, etc.)
// only requires rewriting this file.
import { categories, getCategoryById } from "@/data/categories";
import { experiences, getPriceFrom } from "@/data/experiences";
import { hosts } from "@/data/hosts";
import { reviews } from "@/data/reviews";
import { testimonials } from "@/data/testimonials";
import { blogPosts } from "@/data/blog";
import type { Experience } from "@/lib/types";

export function listCategories() {
  return categories;
}

export function getCategory(slug: string) {
  return categories.find((c) => c.slug === slug);
}

export type ExperienceFilters = {
  q?: string;
  categories?: string[];
  minPrice?: number;
  maxPrice?: number;
  duration?: "under1" | "1to2" | "2to4" | "half" | "full";
  neighbourhood?: string;
  minRating?: number;
  sort?: "recommended" | "price-asc" | "price-desc" | "newest" | "reviewed";
};

function matchesDuration(minutes: number, bucket?: ExperienceFilters["duration"]) {
  if (!bucket) return true;
  if (bucket === "under1") return minutes < 60;
  if (bucket === "1to2") return minutes >= 60 && minutes <= 120;
  if (bucket === "2to4") return minutes > 120 && minutes <= 240;
  if (bucket === "half") return minutes > 240 && minutes <= 360;
  if (bucket === "full") return minutes > 360;
  return true;
}

export function listExperiences(filters: ExperienceFilters = {}, extra: Experience[] = []) {
  const overrideIds = new Set(extra.map((e) => e.id));
  const base = experiences.filter((e) => !overrideIds.has(e.id));
  let results: Experience[] = [...extra, ...base].filter((e) => e.visibility === "public");

  if (filters.q) {
    const q = filters.q.toLowerCase();
    results = results.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        e.shortDescription.toLowerCase().includes(q) ||
        e.neighbourhood.toLowerCase().includes(q)
    );
  }

  if (filters.categories && filters.categories.length > 0) {
    const catIds = filters.categories
      .map((slug) => categories.find((c) => c.slug === slug)?.id)
      .filter(Boolean);
    results = results.filter((e) => catIds.includes(e.categoryId));
  }

  if (filters.minPrice !== undefined) {
    results = results.filter((e) => getPriceFrom(e) >= filters.minPrice!);
  }
  if (filters.maxPrice !== undefined) {
    results = results.filter((e) => getPriceFrom(e) <= filters.maxPrice!);
  }

  if (filters.duration) {
    results = results.filter((e) => matchesDuration(e.durationMinutes, filters.duration));
  }

  if (filters.neighbourhood) {
    results = results.filter(
      (e) => e.neighbourhood.toLowerCase() === filters.neighbourhood!.toLowerCase()
    );
  }

  if (filters.minRating) {
    results = results.filter((e) => e.rating >= filters.minRating!);
  }

  const sort = filters.sort ?? "recommended";
  results = [...results].sort((a, b) => {
    if (sort === "price-asc") return getPriceFrom(a) - getPriceFrom(b);
    if (sort === "price-desc") return getPriceFrom(b) - getPriceFrom(a);
    if (sort === "newest")
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    if (sort === "reviewed") return b.reviewCount - a.reviewCount;
    return b.rating * Math.log(b.reviewCount + 1) - a.rating * Math.log(a.reviewCount + 1);
  });

  return results;
}

export function getExperience(slug: string) {
  return experiences.find((e) => e.slug === slug);
}

export function listPopularExperiences(limit = 8) {
  return listExperiences({ sort: "reviewed" }).slice(0, limit);
}

export function getExperienceCategory(experience: Experience) {
  return getCategoryById(experience.categoryId);
}

export function getExperienceHost(experience: Experience) {
  return hosts.find((h) => h.id === experience.hostId);
}

export function listReviewsFor(experienceId: string) {
  return reviews.filter((r) => r.experienceId === experienceId);
}

export function listTestimonials() {
  return testimonials;
}

export function listBlogPosts(limit?: number) {
  return limit ? blogPosts.slice(0, limit) : blogPosts;
}

export function listNeighbourhoods() {
  return Array.from(new Set(experiences.map((e) => e.neighbourhood))).sort();
}

export function priceRangeBounds() {
  const prices = experiences.map((e) => getPriceFrom(e));
  return { min: 0, max: Math.max(...prices, 500) };
}
