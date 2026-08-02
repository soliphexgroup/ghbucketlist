"use client";

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
