"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { deleteListing, type WriteResult } from "@/lib/db-listings";
import type { ListingKind } from "@/lib/db-availability";

// Admin-only listing moderation. Admin RLS (is_admin()) lets these reads see inactive listings
// too, and lets an admin flip is_active or delete any listing regardless of owner.

export type AdminListing = {
  id: string;
  kind: ListingKind;
  title: string;
  slug: string;
  city: string | null;
  category: string | null;
  priceFrom: number;
  rating: number;
  isActive: boolean;
  /** Services only: the verified badge (from data.verified). null for other kinds. */
  verified: boolean | null;
  hostId: string;
  createdBy: string | null;
  image: string | null;
};

type Row = {
  id: string;
  kind: string;
  title: string;
  slug: string;
  city: string | null;
  category: string | null;
  price_from: number;
  rating: number;
  is_active: boolean;
  host_id: string;
  created_by: string | null;
  data: { images?: string[]; portfolioImages?: string[]; verified?: boolean } | null;
};

function toListing(r: Row): AdminListing {
  const imgs = r.data?.images ?? r.data?.portfolioImages ?? [];
  return {
    id: r.id,
    kind: r.kind as ListingKind,
    title: r.title,
    slug: r.slug,
    city: r.city,
    category: r.category,
    priceFrom: r.price_from,
    rating: r.rating,
    isActive: r.is_active,
    verified: r.kind === "service" ? Boolean(r.data?.verified) : null,
    hostId: r.host_id,
    createdBy: r.created_by,
    image: imgs[0] ?? null,
  };
}

export async function setListingActive(id: string, active: boolean): Promise<WriteResult> {
  const supabase = createClient();
  const { error } = await supabase.from("listings").update({ is_active: active }).eq("id", id);
  if (error) return { ok: false, reason: "error", message: error.message };
  return { ok: true };
}

/**
 * Admin: grant or revoke a service provider's verified badge. The flag lives inside the listing's
 * `data` jsonb, so we read the current data, merge the new value, and write it back (admin RLS
 * "Admins update any listing" permits this). Read-modify-write keeps it to no schema change.
 */
export async function setServiceVerified(id: string, verified: boolean): Promise<WriteResult> {
  const supabase = createClient();
  const { data: row, error: readError } = await supabase
    .from("listings")
    .select("data")
    .eq("id", id)
    .single();
  if (readError) return { ok: false, reason: "error", message: readError.message };
  const current = ((row?.data as Record<string, unknown> | null) ?? {});
  const { error } = await supabase
    .from("listings")
    .update({ data: { ...current, verified } })
    .eq("id", id);
  if (error) return { ok: false, reason: "error", message: error.message };
  return { ok: true };
}

export { deleteListing as removeListing };

/** Admin: every listing (active and inactive), newest first. `refresh()` re-fetches. */
export function useAdminListings(): { listings: AdminListing[]; loaded: boolean; refresh: () => void } {
  const [listings, setListings] = useState<AdminListing[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let active = true;
    createClient()
      .from("listings")
      .select("id,kind,title,slug,city,category,price_from,rating,is_active,host_id,created_by,data")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (!active) return;
        setListings(((data ?? []) as Row[]).map(toListing));
        setLoaded(true);
      });
    return () => {
      active = false;
    };
  }, [tick]);
  return { listings, loaded, refresh: () => setTick((t) => t + 1) };
}
