"use client";

import { createClient } from "@/lib/supabase/client";

// The counter device's data layer. Everything is token-scoped and goes through the br_* RPCs
// (granted to anon), so the device needs no login and never touches tables directly.
//
// Offline-first: when online we cache the partner's discount rates and a SHA-256 digest of member
// phone numbers. That lets the device, with no internet, (a) verify membership, (b) compute the
// customer's saving and what to charge, and (c) queue the sale in localStorage. Queued sales are
// flushed through br_redeem_offline() on reconnect, which logs any that turn out invalid.

export type Rates = { totalPct: number; customerPct: number; commissionPct: number };
export type DeviceInfo = { name: string; active: boolean; rates: Rates } | null;

export type LookupResult =
  | { ok: true; found: boolean; name: string | null }
  | { ok: false; message: string };

export type Provisional = { customerSaving: number; amountDue: number; commission: number };

export type RedeemResult =
  | { ok: true; memberName: string | null; customerSaving: number; amountDue: number; commission: number }
  | { ok: false; queued: true; message: string; provisional?: Provisional }
  | { ok: false; queued: false; message: string };

/** Offline membership check result: "unknown" when the device has never cached the member list. */
export type MemberStatus = "yes" | "no" | "unknown";

function first<T>(data: unknown): T | undefined {
  return (Array.isArray(data) ? data[0] : data) as T | undefined;
}

function isOffline(errMessage?: string) {
  if (typeof navigator !== "undefined" && !navigator.onLine) return true;
  return !!errMessage && /fetch|network|failed to fetch/i.test(errMessage);
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

/** SHA-256 → lowercase hex, matching Postgres encode(digest(phone,'sha256'),'hex'). */
async function sha256Hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// --- Local caches (per device token) ---

const RATES_KEY = (t: string) => `br:rates:${t}`;
const MEMBERS_KEY = (t: string) => `br:members:${t}`;

function cacheRates(token: string, rates: Rates) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(RATES_KEY(token), JSON.stringify(rates));
}

/** The partner's discount rates cached from the last online load, for offline compute. */
export function getCachedRates(token: string): Rates | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(RATES_KEY(token));
    return raw ? (JSON.parse(raw) as Rates) : null;
  } catch {
    return null;
  }
}

/** Download and cache the hashed member list so membership can be checked offline. */
export async function refreshMemberDigest(token: string): Promise<boolean> {
  try {
    const { data, error } = await createClient().rpc("br_member_digest", { p_token: token });
    if (error) return false;
    const hashes = ((data ?? []) as { phone_hash: string }[]).map((r) => r.phone_hash);
    window.localStorage.setItem(MEMBERS_KEY(token), JSON.stringify({ at: new Date().toISOString(), hashes }));
    return true;
  } catch {
    return false;
  }
}

/** Check a phone against the cached member digest, without any network. */
export async function memberStatusOffline(token: string, phone: string): Promise<MemberStatus> {
  if (typeof window === "undefined") return "unknown";
  let cached: { hashes?: unknown } | null = null;
  try {
    cached = JSON.parse(window.localStorage.getItem(MEMBERS_KEY(token)) ?? "null");
  } catch {
    cached = null;
  }
  if (!cached || !Array.isArray(cached.hashes)) return "unknown";
  const hash = await sha256Hex(phone.trim());
  return (cached.hashes as string[]).includes(hash) ? "yes" : "no";
}

/** Resolve a device token to its partner (name, active, rates) and cache the rates for offline use. */
export async function brDeviceInfo(token: string): Promise<DeviceInfo> {
  const { data, error } = await createClient().rpc("br_device_info", { p_token: token });
  if (error) return null;
  const row = first<{
    name: string;
    active: boolean;
    total_discount_pct: number;
    customer_pct: number;
    commission_pct: number;
  }>(data);
  if (!row) return null;
  const rates: Rates = {
    totalPct: Number(row.total_discount_pct),
    customerPct: Number(row.customer_pct),
    commissionPct: Number(row.commission_pct),
  };
  cacheRates(token, rates);
  return { name: row.name, active: row.active, rates };
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

/** Queue an offline sale and, if the rates are cached, compute the provisional discount to show now. */
function queueOffline(token: string, phone: string, amount: number): RedeemResult {
  enqueueRedemption({ token, phone: phone.trim(), amount });
  const rates = getCachedRates(token);
  if (rates) {
    const customerSaving = round2((amount * rates.customerPct) / 100);
    const commission = round2((amount * rates.commissionPct) / 100);
    return {
      ok: false,
      queued: true,
      message: "Saved offline — will sync when back online.",
      provisional: { customerSaving, amountDue: round2(amount - customerSaving), commission },
    };
  }
  return { ok: false, queued: true, message: "Saved offline — will sync when back online." };
}

export async function brRedeem(token: string, phone: string, amount: number): Promise<RedeemResult> {
  try {
    const { data, error } = await createClient().rpc("br_redeem", {
      p_token: token,
      p_phone: phone.trim(),
      p_amount: amount,
    });
    if (error) {
      if (isOffline(error.message)) return queueOffline(token, phone, amount);
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
  } catch {
    // Network throw (device fully offline).
    return queueOffline(token, phone, amount);
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
 * Try to sync every queued redemption through br_redeem_offline(), which records the original sale
 * time and logs any that fail validation (e.g. not a member) to br_failed_redemptions for admin
 * follow-up. Synced + rejected entries are removed; entries still failing on the network are kept.
 * Returns how many synced cleanly and how many were rejected (given in error → reported to admin).
 */
export async function flushQueue(): Promise<{ synced: number; failed: number }> {
  const queue = readQueue();
  if (queue.length === 0) return { synced: 0, failed: 0 };
  const supabase = createClient();
  const remaining: QueuedRedemption[] = [];
  let synced = 0;
  let failed = 0;

  for (const item of queue) {
    try {
      const { data, error } = await supabase.rpc("br_redeem_offline", {
        p_token: item.token,
        p_phone: item.phone,
        p_amount: item.amount,
        p_at: item.at,
      });
      if (error) {
        if (isOffline(error.message)) remaining.push(item); // still offline — keep for later
        else failed += 1; // unexpected server error — drop so it can't loop forever
        continue;
      }
      const row = first<{ status: string }>(data);
      if (row?.status === "ok") synced += 1;
      else failed += 1; // 'rejected' — already logged server-side to br_failed_redemptions
    } catch {
      remaining.push(item);
    }
  }

  writeQueue(remaining);
  return { synced, failed };
}
