"use client";

import { useSearchParams } from "next/navigation";
import { VehicleTypeCategories } from "@/components/cars/vehicle-type-categories";
import { CarBrowser } from "@/components/cars/car-browser";

export function CarsLanding() {
  const hasFilters = useSearchParams().toString().length > 0;
  return hasFilters ? <CarBrowser /> : <VehicleTypeCategories />;
}
