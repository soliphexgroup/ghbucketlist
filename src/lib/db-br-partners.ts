"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { WriteResult } from "@/lib/db-listings";

// Bucket Rewards partner businesses. The public directory reads the br_public_partners view
// (no device_token); admins read/write the base table (which includes the token).

export type BrTier = "starter" | "featured" | "premium";
export type BrPartnerStatus = "active" | "paused";

export type BrPartner = {
  id: string;
  name: string;
  slug: string;
  category: string | null;
  area: string | null;
  tier: BrTier;
  totalDiscountPct: number;
  customerPct: number;
  commissionPct: number;
  imageUrl: string | null;
  description: string | null;
};

type PublicRow = {
  id: string;
  name: string;
  slug: string;
  category: string | null;
  area: string | null;
  tier: string;
  total_discount_pct: number;
  customer_pct: number;
  commission_pct: number;
  image_url: string | null;
  description: string | null;
};

function toPartner(r: PublicRow): BrPartner {
  return {
    id: r.id,
    name: r.name,
    slug: r.slug,
    category: r.category,
    area: r.area,
    tier: (r.tier as BrTier) ?? "starter",
    totalDiscountPct: r.total_discount_pct,
    customerPct: r.customer_pct,
    commissionPct: r.commission_pct,
    imageUrl: r.image_url,
    description: r.description,
  };
}

/** Public directory of active BR partners. Empty while loading. */
export function useBrPartners(): { partners: BrPartner[]; loaded: boolean } {
  const [partners, setPartners] = useState<BrPartner[]>([]);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    let active = true;
    createClient()
      .from("br_public_partners")
      .select("id,name,slug,category,area,tier,total_discount_pct,customer_pct,commission_pct,image_url,description")
      .order("name", { ascending: true })
      .then(({ data }) => {
        if (!active) return;
        setPartners(((data ?? []) as PublicRow[]).map(toPartner));
        setLoaded(true);
      });
    return () => {
      active = false;
    };
  }, []);
  return { partners, loaded };
}

// --- Admin (base table, includes device_token) ---

export type AdminBrPartner = BrPartner & {
  status: BrPartnerStatus;
  deviceToken: string;
  createdAt: string;
};

type AdminRow = PublicRow & { status: string; device_token: string; created_at: string };

function toAdminPartner(r: AdminRow): AdminBrPartner {
  return {
    ...toPartner(r),
    status: (r.status as BrPartnerStatus) ?? "active",
    deviceToken: r.device_token,
    createdAt: r.created_at,
  };
}

export type BrPartnerInput = {
  name: string;
  category: string;
  area: string;
  tier: BrTier;
  totalDiscountPct: number;
  customerPct: number;
  commissionPct: number;
  description: string;
};

function slugify(name: string) {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function columns(input: BrPartnerInput) {
  return {
    name: input.name.trim(),
    category: input.category.trim() || null,
    area: input.area.trim() || null,
    tier: input.tier,
    total_discount_pct: input.totalDiscountPct,
    customer_pct: input.customerPct,
    commission_pct: input.commissionPct,
    description: input.description.trim() || null,
    updated_at: new Date().toISOString(),
  };
}

export async function createBrPartner(input: BrPartnerInput): Promise<WriteResult> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const slug = `${slugify(input.name) || "partner"}-${Math.random().toString(36).slice(2, 6)}`;
  const { error } = await supabase
    .from("br_partners")
    .insert({ ...columns(input), slug, created_by: session?.user.id ?? null });
  if (error) return { ok: false, reason: "error", message: error.message };
  return { ok: true };
}

export async function updateBrPartner(id: string, input: BrPartnerInput): Promise<WriteResult> {
  const supabase = createClient();
  const { error } = await supabase.from("br_partners").update(columns(input)).eq("id", id);
  if (error) return { ok: false, reason: "error", message: error.message };
  return { ok: true };
}

export async function setBrPartnerStatus(id: string, status: BrPartnerStatus): Promise<WriteResult> {
  const supabase = createClient();
  const { error } = await supabase.from("br_partners").update({ status }).eq("id", id);
  if (error) return { ok: false, reason: "error", message: error.message };
  return { ok: true };
}

/** Admin: every partner (active + paused), with device tokens. `refresh()` re-fetches. */
export function useAdminBrPartners(): { partners: AdminBrPartner[]; loaded: boolean; refresh: () => void } {
  const [partners, setPartners] = useState<AdminBrPartner[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let active = true;
    createClient()
      .from("br_partners")
      .select("id,name,slug,category,area,tier,status,total_discount_pct,customer_pct,commission_pct,image_url,description,device_token,created_at")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (!active) return;
        setPartners(((data ?? []) as AdminRow[]).map(toAdminPartner));
        setLoaded(true);
      });
    return () => {
      active = false;
    };
  }, [tick]);
  return { partners, loaded, refresh: () => setTick((t) => t + 1) };
}
