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
  completedJobs: number;
  skills: string[];
  rating: number;
  reviewCount: number;
  createdAt: string;
};
