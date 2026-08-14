"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Property } from "@/lib/stay-types";
import type { Car } from "@/lib/car-types";
import type { Experience } from "@/lib/types";
import type { ServiceProvider } from "@/lib/service-types";
import { getPriceFrom } from "@/data/experiences";

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
export function useHostDbStayListings(hostId: string): { items: Property[]; loaded: boolean } {
  const [rows, setRows] = useState<Property[]>([]);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    let active = true;
    setLoaded(false);
    createClient()
      .from("listings")
      .select("data")
      .eq("kind", "stay")
      .eq("host_id", hostId)
      .then(({ data }) => {
        if (!active) return;
        setRows(((data ?? []) as ListingRow[]).map((r) => r.data));
        setLoaded(true);
      });
    return () => {
      active = false;
    };
  }, [hostId]);
  return { items: rows, loaded };
}

// --- Cars (a car's owner is its vendorId; whole-unit, one bookable vehicle each) ---

function carColumns(c: Car, hostId: string, createdBy: string | null) {
  return {
    id: c.id,
    kind: "car" as const,
    host_id: hostId,
    slug: c.slug,
    title: `${c.make} ${c.model} ${c.year}`,
    city: c.city,
    category: c.category,
    price_from: c.pricePerDay,
    rating: c.rating,
    created_by: createdBy,
    data: c,
    updated_at: new Date().toISOString(),
  };
}

export async function createCarListing(car: Car, hostId: string): Promise<WriteResult> {
  const { supabase, userId } = await requireUser();
  if (!userId) return { ok: false, reason: "signin", message: "Please sign in to publish a car." };
  const { error } = await supabase.from("listings").insert(carColumns(car, hostId, userId));
  if (error) return { ok: false, reason: "error", message: error.message };
  return { ok: true };
}

export async function updateCarListing(car: Car, hostId: string): Promise<WriteResult> {
  const { supabase, userId } = await requireUser();
  if (!userId) return { ok: false, reason: "signin", message: "Please sign in to edit a car." };
  const { error } = await supabase.from("listings").update(carColumns(car, hostId, userId)).eq("id", car.id);
  if (error) return { ok: false, reason: "error", message: error.message };
  return { ok: true };
}

/** Every car listing in the catalog (seeded + host-created). Empty while loading. */
export function useDbCarListings(): Car[] {
  const [rows, setRows] = useState<Car[]>([]);
  useEffect(() => {
    let active = true;
    createClient()
      .from("listings")
      .select("data")
      .eq("kind", "car")
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        if (active) setRows(((data ?? []) as { data: Car }[]).map((r) => r.data));
      });
    return () => {
      active = false;
    };
  }, []);
  return rows;
}

/** The given host's own car listings. */
export function useHostDbCarListings(hostId: string): { items: Car[]; loaded: boolean } {
  const [rows, setRows] = useState<Car[]>([]);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    let active = true;
    setLoaded(false);
    createClient()
      .from("listings")
      .select("data")
      .eq("kind", "car")
      .eq("host_id", hostId)
      .then(({ data }) => {
        if (!active) return;
        setRows(((data ?? []) as { data: Car }[]).map((r) => r.data));
        setLoaded(true);
      });
    return () => {
      active = false;
    };
  }, [hostId]);
  return { items: rows, loaded };
}

// --- Experiences (capacity-based single-day sessions; owner is the experience's hostId) ---

function experienceColumns(e: Experience, hostId: string, createdBy: string | null) {
  return {
    id: e.id,
    kind: "experience" as const,
    host_id: hostId,
    slug: e.slug,
    title: e.title,
    city: e.city,
    category: e.categoryId,
    price_from: getPriceFrom(e),
    rating: e.rating,
    created_by: createdBy,
    data: e,
    updated_at: new Date().toISOString(),
  };
}

export async function createExperienceListing(exp: Experience, hostId: string): Promise<WriteResult> {
  const { supabase, userId } = await requireUser();
  if (!userId) return { ok: false, reason: "signin", message: "Please sign in to publish an experience." };
  const { error } = await supabase.from("listings").insert(experienceColumns(exp, hostId, userId));
  if (error) return { ok: false, reason: "error", message: error.message };
  return { ok: true };
}

export async function updateExperienceListing(exp: Experience, hostId: string): Promise<WriteResult> {
  const { supabase, userId } = await requireUser();
  if (!userId) return { ok: false, reason: "signin", message: "Please sign in to edit an experience." };
  const { error } = await supabase
    .from("listings")
    .update(experienceColumns(exp, hostId, userId))
    .eq("id", exp.id);
  if (error) return { ok: false, reason: "error", message: error.message };
  return { ok: true };
}

/** Every experience listing in the catalog (seeded + host-created). Empty while loading. */
export function useDbExperienceListings(): Experience[] {
  const [rows, setRows] = useState<Experience[]>([]);
  useEffect(() => {
    let active = true;
    createClient()
      .from("listings")
      .select("data")
      .eq("kind", "experience")
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        if (active) setRows(((data ?? []) as { data: Experience }[]).map((r) => r.data));
      });
    return () => {
      active = false;
    };
  }, []);
  return rows;
}

/** The given host's own experience listings. */
export function useHostDbExperienceListings(hostId: string): { items: Experience[]; loaded: boolean } {
  const [rows, setRows] = useState<Experience[]>([]);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    let active = true;
    setLoaded(false);
    createClient()
      .from("listings")
      .select("data")
      .eq("kind", "experience")
      .eq("host_id", hostId)
      .then(({ data }) => {
        if (!active) return;
        setRows(((data ?? []) as { data: Experience }[]).map((r) => r.data));
        setLoaded(true);
      });
    return () => {
      active = false;
    };
  }, [hostId]);
  return { items: rows, loaded };
}

// --- Services (handyman providers; read-only catalog — no self-serve host CRUD) ---

/** Every service provider in the catalog. Empty while loading. */
export function useDbServiceListings(): ServiceProvider[] {
  const [rows, setRows] = useState<ServiceProvider[]>([]);
  useEffect(() => {
    let active = true;
    createClient()
      .from("listings")
      .select("data")
      .eq("kind", "service")
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        if (active) setRows(((data ?? []) as { data: ServiceProvider }[]).map((r) => r.data));
      });
    return () => {
      active = false;
    };
  }, []);
  return rows;
}
