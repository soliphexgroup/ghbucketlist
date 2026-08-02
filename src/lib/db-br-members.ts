"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { WriteResult } from "@/lib/db-listings";

// Bucket Rewards membership is phone-based (no login). Sign-up goes through the br_signup RPC,
// which upserts by phone so re-joining is harmless.

export async function brSignup(phone: string, name: string): Promise<WriteResult> {
  const supabase = createClient();
  const { error } = await supabase.rpc("br_signup", {
    p_phone: phone.trim(),
    p_name: name.trim() || null,
  });
  if (error) return { ok: false, reason: "error", message: error.message };
  return { ok: true };
}

export type BrMember = {
  id: string;
  phone: string;
  name: string | null;
  createdAt: string;
};

type MemberRow = { id: string; phone: string; name: string | null; created_at: string };

/** Admin: all BR members, newest first (RLS admin-only). */
export function useBrMembers(): { members: BrMember[]; loaded: boolean } {
  const [members, setMembers] = useState<BrMember[]>([]);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    let active = true;
    createClient()
      .from("br_members")
      .select("id,phone,name,created_at")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (!active) return;
        setMembers(
          ((data ?? []) as MemberRow[]).map((r) => ({
            id: r.id,
            phone: r.phone,
            name: r.name,
            createdAt: r.created_at,
          }))
        );
        setLoaded(true);
      });
    return () => {
      active = false;
    };
  }, []);
  return { members, loaded };
}
