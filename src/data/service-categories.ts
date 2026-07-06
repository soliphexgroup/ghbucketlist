import type { ServiceCategory } from "@/lib/service-types";

export const serviceCategoryLabels: Record<ServiceCategory, string> = {
  carpenter: "Carpenter",
  electrician: "Electrician",
  plumber: "Plumber",
  cleaner: "Cleaner",
  welder: "Welder",
};

export const serviceCategoryIcons: Record<ServiceCategory, string> = {
  carpenter: "Hammer",
  electrician: "Zap",
  plumber: "Wrench",
  cleaner: "Sparkles",
  welder: "Flame",
};

export const serviceCategories: ServiceCategory[] = ["carpenter", "electrician", "plumber", "cleaner", "welder"];
