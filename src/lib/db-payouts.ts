"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { WriteResult } from "@/lib/db-listings";

// Payout requests. A host inserts a request (RLS: own rows); an admin reads all (is_admin RLS)
// and approves/rejects. Kept separate from bookings so it can grow its own lifecycle.

export type PayoutStatus = "pending" | "approved" | "rejected";

export type Payout = {
  id: string;
  hostId: string;
  amount: number;
  method: string | null;
  status: PayoutStatus;
  requestedAt: string;
};

type Row = {
  id: string;
  host_id: string;
  amount: number;
  method: string | null;
  status: string;
  requested_at: string;
};

function toPayout(r: Row): Payout {
  return {
    id: r.id,
    hostId: r.host_id,
    amount: r.amount,
    method: r.method,
    status: (r.status as PayoutStatus) ?? "pending",
    requestedAt: r.requested_at,
  };
}

/** Host requests a payout for their own account. */
export async function requestPayout(input: { amount: number; method: string }): Promise<WriteResult> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return { ok: false, reason: "signin", message: "Please sign in to request a payout." };
  const { error } = await supabase.from("payouts").insert({
    host_id: session.user.id,
    amount: input.amount,
    method: input.method,
  });
  if (error) return { ok: false, reason: "error", message: error.message };
  return { ok: true };
}

/** Admin decision on a payout request. */
export async function setPayoutStatus(id: string, status: PayoutStatus): Promise<WriteResult> {
  const supabase = createClient();
  const { error } = await supabase
    .from("payouts")
    .update({ status, decided_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { ok: false, reason: "error", message: error.message };
  return { ok: true };
}

/** Payouts visible to the caller (admins: all; hosts: their own), newest first. */
export function usePayouts(): { payouts: Payout[]; loaded: boolean; refresh: () => void } {
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let active = true;
    createClient()
      .from("payouts")
      .select("id,host_id,amount,method,status,requested_at")
      .order("requested_at", { ascending: false })
      .then(({ data }) => {
        if (!active) return;
        setPayouts(((data ?? []) as Row[]).map(toPayout));
        setLoaded(true);
      });
    return () => {
      active = false;
    };
  }, [tick]);
  return { payouts, loaded, refresh: () => setTick((t) => t + 1) };
}
