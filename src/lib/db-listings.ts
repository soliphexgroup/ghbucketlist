"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Property } from "@/lib/stay-types";

// Read/write the shared listings catalog. Listings live as one row each with the full typed
// object in `data`, so reads return the same shapes the app already uses. Writes require a
// signed-in owner (RLS: created_by = auth.uid()).

export type ListingKind = "stay" | "car" | "experience" | "service";

type ListingRow = { data: Property };

/** Normalized columns kept alongside the JSONB, for filtering. Stay-specific here. */
function stayColumns(p: Property, hostId: string, createdBy: string | null) {
  return {
    id: p.id,
    kind: "stay" as const,
    host_id: hostId,
    slug: p.slug,
    title: p.title,
    city: p.city,
    category: p.propertyType,
    price_from: p.pricePerNight,
    rating: p.rating,
    created_by: createdBy,
    data: p,
    updated_at: new Date().toISOString(),
  };
}

export type WriteResult = { ok: true } | { ok: false; reason: "signin" | "error"; message: string };

async function requireUser() {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return { supabase, userId: session?.user.id ?? null };
}

/** Insert a new stay listing owned by the signed-in host. */
export async function createStayListing(property: Property, hostId: string): Promise<WriteResult> {
  const { supabase, userId } = await requireUser();
  if (!userId) return { ok: false, reason: "signin", message: "Please sign in to publish a listing." };
  const { error } = await supabase.from("listings").insert(stayColumns(property, hostId, userId));
  if (error) return { ok: false, reason: "error", message: error.message };
  return { ok: true };
}

/** Update an existing stay listing the signed-in host owns. */
export async function updateStayListing(property: Property, hostId: string): Promise<WriteResult> {
  const { supabase, userId } = await requireUser();
  if (!userId) return { ok: false, reason: "signin", message: "Please sign in to edit a listing." };
  const { error } = await supabase
    .from("listings")
    .update(stayColumns(property, hostId, userId))
    .eq("id", property.id);
  if (error) return { ok: false, reason: "error", message: error.message };
  return { ok: true };
}

export async function deleteListing(id: string): Promise<WriteResult> {
  const { supabase, userId } = await requireUser();
  if (!userId) return { ok: false, reason: "signin", message: "Please sign in." };
  const { error } = await supabase.from("listings").delete().eq("id", id);
  if (error) return { ok: false, reason: "error", message: error.message };
  return { ok: true };
}

/** Every stay listing in the catalog (seeded + host-created). Empty while loading. */
export function useDbStayListings(): Property[] {
  const [rows, setRows] = useState<Property[]>([]);
  useEffect(() => {
    let active = true;
    createClient()
      .from("listings")
      .select("data")
      .eq("kind", "stay")
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        if (active) setRows(((data ?? []) as ListingRow[]).map((r) => r.data));
      });
    return () => {
      active = false;
    };
  }, []);
  return rows;
}

/** The given host's own stay listings (their seeded ones plus anything they've created). */
export function useHostDbStayListings(hostId: string): Property[] {
  const [rows, setRows] = useState<Property[]>([]);
  useEffect(() => {
    let active = true;
    createClient()
      .from("listings")
      .select("data")
      .eq("kind", "stay")
      .eq("host_id", hostId)
      .then(({ data }) => {
        if (active) setRows(((data ?? []) as ListingRow[]).map((r) => r.data));
      });
    return () => {
      active = false;
    };
  }, [hostId]);
  return rows;
}
