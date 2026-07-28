import { createClient } from "@/lib/supabase/server";
import type { Property } from "@/lib/stay-types";
import type { Car } from "@/lib/car-types";

// Server-side catalog reads for detail pages (server components). Public-read RLS applies.

/** Fetch one stay listing by slug from the DB, or null. */
export async function getStayListingBySlug(slug: string): Promise<Property | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("listings")
    .select("data")
    .eq("kind", "stay")
    .eq("slug", slug)
    .maybeSingle();
  return (data?.data as Property) ?? null;
}

/** Fetch one car listing by slug from the DB, or null. */
export async function getCarListingBySlug(slug: string): Promise<Car | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("listings")
    .select("data")
    .eq("kind", "car")
    .eq("slug", slug)
    .maybeSingle();
  return (data?.data as Car) ?? null;
}
