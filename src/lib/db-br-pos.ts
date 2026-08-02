"use client";

import { createClient } from "@/lib/supabase/client";

// The counter device's data layer. Everything is token-scoped and goes through the br_* RPCs
// (granted to anon), so the device needs no login and never touches tables directly. Redemptions
// that fail because the device is offline are queued in localStorage and flushed on reconnect.

export type LookupResult =
  | { ok: true; found: boolean; name: string | null }
  | { ok: false; message: string };

export type RedeemResult =
  | { ok: true; memberName: string | null; customerSaving: number; amountDue: number; commission: number }
  | { ok: false; queued: boolean; message: string };

function first<T>(data: unknown): T | undefined {
  return (Array.isArray(data) ? data[0] : data) as T | undefined;
}

function isOffline(errMessage?: string) {
  if (typeof navigator !== "undefined" && !navigator.onLine) return true;
  return !!errMessage && /fetch|network|failed to fetch/i.test(errMessage);
}

export type DeviceInfo = { name: string; active: boolean } | null;

/** Resolve a device token to its partner (name + active), so the counter app can confirm setup. */
export async function brDeviceInfo(token: string): Promise<DeviceInfo> {
  const { data, error } = await createClient().rpc("br_device_info", { p_token: token });
  if (error) return null;
  const row = first<{ name: string; active: boolean }>(data);
  return row ? { name: row.name, active: row.active } : null;
}

export async function brLookupMember(token: string, phone: string): Promise<LookupResult> {
  const { data, error } = await createClient().rpc("br_lookup_member", {
    p_token: token,
    p_phone: phone.trim(),
  });
  if (error) return { ok: false, message: error.message };
  const row = first<{ found: boolean; name: string | null }>(data);
  return { ok: true, found: !!row?.found, name: row?.name ?? null };
}

export async function brRedeem(token: string, phone: string, amount: number): Promise<RedeemResult> {
  try {
    const { data, error } = await createClient().rpc("br_redeem", {
      p_token: token,
      p_phone: phone.trim(),
      p_amount: amount,
    });
    if (error) {
      if (isOffline(error.message)) {
        enqueueRedemption({ token, phone: phone.trim(), amount });
        return { ok: false, queued: true, message: "Saved offline — will sync when back online." };
      }
      return { ok: false, queued: false, message: error.message };
    }
    const row = first<{ member_name: string | null; customer_saving: number; amount_due: number; commission: number }>(data);
    if (!row) return { ok: false, queued: false, message: "Unexpected response." };
    return {
      ok: true,
      memberName: row.member_name,
      customerSaving: row.customer_saving,
      amountDue: row.amount_due,
      commission: row.commission,
    };
  } catch (e) {
    // Network throw (device fully offline).
    enqueueRedemption({ token, phone: phone.trim(), amount });
    return { ok: false, queued: true, message: "Saved offline — will sync when back online." };
  }
}

// --- Offline queue (localStorage) ---

type QueuedRedemption = { token: string; phone: string; amount: number; at: string };
const QUEUE_KEY = "br:redeem-queue";

function readQueue(): QueuedRedemption[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(QUEUE_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function writeQueue(q: QueuedRedemption[]) {
  window.localStorage.setItem(QUEUE_KEY, JSON.stringify(q));
}

export function enqueueRedemption(item: Omit<QueuedRedemption, "at">) {
  writeQueue([...readQueue(), { ...item, at: new Date().toISOString() }]);
}

export function queuedCount(): number {
  return readQueue().length;
}

/**
 * Try to sync every queued redemption. Successes and permanent rejections (e.g. "not a member")
 * are removed; entries that fail again because we're still offline are kept for the next flush.
 * Returns the number successfully synced.
 */
export async function flushQueue(): Promise<number> {
  const queue = readQueue();
  if (queue.length === 0) return 0;
  const supabase = createClient();
  const remaining: QueuedRedemption[] = [];
  let synced = 0;

  for (const item of queue) {
    try {
      const { error } = await supabase.rpc("br_redeem", {
        p_token: item.token,
        p_phone: item.phone,
        p_amount: item.amount,
      });
      if (!error) {
        synced += 1;
      } else if (isOffline(error.message)) {
        remaining.push(item); // still offline — keep for later
      }
      // else: permanent rejection (e.g. not a member / invalid) — drop it
    } catch {
      remaining.push(item);
    }
  }

  writeQueue(remaining);
  return synced;
}
