import { createClient } from "@/lib/supabase/server";
import type { Property } from "@/lib/stay-types";

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
