"use client";

import { useSearchParams } from "next/navigation";
import { ThingsToDoCategories } from "@/components/activities/things-to-do-categories";
import { ActivitiesBrowser } from "@/components/activities/activities-browser";

/**
 * Any of these means the visitor has searched or filtered, so they want results
 * rather than the category tiles. The hero's search box always sends at least
 * `participants`, so searching without a location still lands on the browser.
 */
const RESULT_PARAMS = [
  "category",
  "q",
  "date",
  "participants",
  "duration",
  "neighbourhood",
  "minRating",
  "maxPrice",
  "sort",
];

export function ThingsToDoLanding() {
  const params = useSearchParams();
  const hasQuery = RESULT_PARAMS.some((key) => params.get(key));
  return hasQuery ? <ActivitiesBrowser /> : <ThingsToDoCategories />;
}
