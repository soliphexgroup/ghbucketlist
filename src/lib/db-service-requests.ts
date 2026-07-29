"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toISODate } from "@/lib/availability";
import { addDays } from "@/lib/dates";
import type { StoredServiceRequest, ServiceRequestStatus } from "@/lib/service-requests-store";
import type { ServiceProvider } from "@/lib/service-types";

// Service requests are leads, not calendar reservations: many people can request the same
// provider, and the "preferred date" is free text. So they're written straight to the bookings
// table (kind=service) rather than through the availability-checked create_booking RPC. RLS
// still ties every row to the signed-in user.

export type CreateServiceRequestInput = {
  reference: string;
  provider: ServiceProvider;
  jobDescription: string;
  preferredDate: string;
  address: string;
  phone: string;
};

export type ServiceRequestResult =
  | { ok: true }
  | { ok: false; reason: "signin" | "error"; message: string };

export async function createServiceRequest(input: CreateServiceRequestInput): Promise<ServiceRequestResult> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return { ok: false, reason: "signin", message: "Please sign in to send a request." };

  // The schema needs a valid 1-day range; the real (free-text) preferred date lives in details.
  const today = new Date();
  const { error } = await supabase.from("bookings").insert({
    reference: input.reference,
    kind: "service",
    listing_id: input.provider.id,
    unit_key: "",
    user_id: session.user.id,
    guest_name: session.user.email ?? null,
    guest_email: session.user.email ?? null,
    start_date: toISODate(today),
    end_date: toISODate(addDays(today, 1)),
    units: 1,
    guests: 1,
    total: 0,
    status: "pending",
    details: {
      category: input.provider.category,
      jobDescription: input.jobDescription,
      preferredDate: input.preferredDate,
      address: input.address,
      phone: input.phone,
    },
  });

  if (error) return { ok: false, reason: "error", message: error.message };
  return { ok: true };
}

type Row = {
  reference: string;
  listing_id: string;
  status: string;
  details: {
    category?: string;
    jobDescription?: string;
    preferredDate?: string;
    address?: string;
    phone?: string;
  } | null;
  created_at: string;
  listings: { data: ServiceProvider } | null;
};

function toStatus(s: string): ServiceRequestStatus {
  if (s === "confirmed") return "accepted";
  if (s === "accepted" || s === "declined" || s === "completed" || s === "cancelled") return s;
  return "pending";
}

function toStored(row: Row): StoredServiceRequest | null {
  const p = row.listings?.data;
  if (!p) return null;
  return {
    reference: row.reference,
    providerId: row.listing_id,
    providerSlug: p.slug,
    providerName: p.name,
    providerAvatar: p.avatarUrl,
    category: (row.details?.category as StoredServiceRequest["category"]) ?? p.category,
    jobDescription: row.details?.jobDescription ?? "",
    preferredDate: row.details?.preferredDate ?? "",
    address: row.details?.address ?? "",
    phone: row.details?.phone ?? "",
    status: toStatus(row.status),
    createdAtISO: row.created_at,
  };
}

/** The signed-in user's service requests from the DB. Empty while loading or when signed out. */
export function useDbServiceRequests(): StoredServiceRequest[] {
  const [requests, setRequests] = useState<StoredServiceRequest[]>([]);
  useEffect(() => {
    let active = true;
    createClient()
      .from("bookings")
      .select("reference,listing_id,status,details,created_at,listings(data)")
      .eq("kind", "service")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (!active) return;
        setRequests(
          ((data ?? []) as unknown as Row[]).map(toStored).filter((r): r is StoredServiceRequest => r !== null)
        );
      });
    return () => {
      active = false;
    };
  }, []);
  return requests;
}
