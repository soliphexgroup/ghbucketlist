"use client";

import { useSearchParams } from "next/navigation";
import { ThingsToDoCategories } from "@/components/activities/things-to-do-categories";
import { ActivitiesBrowser } from "@/components/activities/activities-browser";

export function ThingsToDoLanding() {
  const category = useSearchParams().get("category");
  return category ? <ActivitiesBrowser /> : <ThingsToDoCategories />;
}
