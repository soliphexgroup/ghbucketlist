"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { WriteResult } from "@/lib/db-listings";

// Admin-only read of BR redemptions, for tracking and commission reconciliation. RLS restricts
// this to admins (is_admin()).

export type BrRedemption = {
  id: string;
  partnerId: string;
  memberPhone: string;
  amount: number;
  customerSaving: number;
  commission: number;
  settledAt: string | null;
  createdAt: string;
};

type Row = {
  id: string;
  partner_id: string;
  member_phone: string;
  amount: number;
  customer_saving: number;
  commission: number;
  settled_at: string | null;
  created_at: string;
};

function toRedemption(r: Row): BrRedemption {
  return {
    id: r.id,
    partnerId: r.partner_id,
    memberPhone: r.member_phone,
    amount: r.amount,
    customerSaving: r.customer_saving,
    commission: r.commission,
    settledAt: r.settled_at,
    createdAt: r.created_at,
  };
}

/** Mark a partner's unsettled commission as paid; returns the settled amount. */
export async function settlePartner(partnerId: string): Promise<WriteResult> {
  const supabase = createClient();
  const { error } = await supabase.rpc("br_settle_partner", { p_partner_id: partnerId });
  if (error) return { ok: false, reason: "error", message: error.message };
  return { ok: true };
}

/** Admin: every redemption, newest first. `refresh()` re-fetches. */
export function useBrRedemptions(): { redemptions: BrRedemption[]; loaded: boolean; refresh: () => void } {
  const [redemptions, setRedemptions] = useState<BrRedemption[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let active = true;
    createClient()
      .from("br_redemptions")
      .select("id,partner_id,member_phone,amount,customer_saving,commission,settled_at,created_at")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (!active) return;
        setRedemptions(((data ?? []) as Row[]).map(toRedemption));
        setLoaded(true);
      });
    return () => {
      active = false;
    };
  }, [tick]);
  return { redemptions, loaded, refresh: () => setTick((t) => t + 1) };
}

// --- Failed offline redemptions ---
// Offline sales that failed validation when the device synced (e.g. the phone wasn't a member, so a
// discount was given in error). Written by br_redeem_offline(); admin-only read for follow-up.

export type BrFailedRedemption = {
  id: string;
  partnerId: string | null;
  memberPhone: string | null;
  amount: number | null;
  reason: string; // 'not_member' | 'unknown_device' | 'invalid_amount'
  occurredAt: string | null;
  createdAt: string;
};

type FailedRow = {
  id: string;
  partner_id: string | null;
  member_phone: string | null;
  amount: number | null;
  reason: string;
  occurred_at: string | null;
  created_at: string;
};

/** Admin: offline redemptions that failed to sync, newest first. */
export function useBrFailedRedemptions(): { failed: BrFailedRedemption[]; loaded: boolean } {
  const [failed, setFailed] = useState<BrFailedRedemption[]>([]);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    let active = true;
    createClient()
      .from("br_failed_redemptions")
      .select("id,partner_id,member_phone,amount,reason,occurred_at,created_at")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (!active) return;
        setFailed(
          ((data ?? []) as FailedRow[]).map((r) => ({
            id: r.id,
            partnerId: r.partner_id,
            memberPhone: r.member_phone,
            amount: r.amount,
            reason: r.reason,
            occurredAt: r.occurred_at,
            createdAt: r.created_at,
          }))
        );
        setLoaded(true);
      });
    return () => {
      active = false;
    };
  }, []);
  return { failed, loaded };
}
