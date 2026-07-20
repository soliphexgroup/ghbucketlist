"use client";

import { useSearchParams } from "next/navigation";
import { ThingsToDoCategories } from "@/components/activities/things-to-do-categories";
import { ActivitiesBrowser } from "@/components/activities/activities-browser";

/**
 * Any of these means the visitor has searched or filtered, so they want results
 * rather than the category tiles. `searched` is the explicit marker the search box
 * sends when nothing was filled in, which would otherwise look like no search at all.
 */
const RESULT_PARAMS = [
  "category",
  "q",
  "date",
  "searched",
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
