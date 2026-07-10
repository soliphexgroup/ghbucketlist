"use client";

import { useSearchParams } from "next/navigation";
import { ServiceTypeCategories } from "@/components/services/service-type-categories";
import { ServiceBrowser } from "@/components/services/service-browser";

export function ServicesLanding() {
  const hasFilters = useSearchParams().toString().length > 0;
  return hasFilters ? <ServiceBrowser /> : <ServiceTypeCategories />;
}
