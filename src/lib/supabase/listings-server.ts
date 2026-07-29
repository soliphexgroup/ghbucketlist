import { createClient } from "@/lib/supabase/server";
import type { Property } from "@/lib/stay-types";
import type { Car } from "@/lib/car-types";
import type { Experience } from "@/lib/types";
import type { ServiceProvider } from "@/lib/service-types";

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

/** Fetch one experience listing by slug from the DB, or null. */
export async function getExperienceListingBySlug(slug: string): Promise<Experience | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("listings")
    .select("data")
    .eq("kind", "experience")
    .eq("slug", slug)
    .maybeSingle();
  return (data?.data as Experience) ?? null;
}

/** Fetch one service provider by slug from the DB, or null. */
export async function getServiceListingBySlug(slug: string): Promise<ServiceProvider | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("listings")
    .select("data")
    .eq("kind", "service")
    .eq("slug", slug)
    .maybeSingle();
  return (data?.data as ServiceProvider) ?? null;
}
