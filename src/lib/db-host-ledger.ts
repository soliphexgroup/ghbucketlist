"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { nightsBetween, daysBetween } from "@/lib/dates";
import type { HostBooking, HostLedgerEntry, HostLedgerKind, HostLedgerStatus } from "@/lib/host-types";

// Real host-side data: bookings made against listings this host owns (listing.created_by = uid).
// The bookings RLS already lets a listing's owner read its bookings, so these hooks return only
// the signed-in host's own listings' bookings. Empty when signed out (used only on the real path).

type Row = {
  reference: string;
  kind: string;
  listing_id: string;
  start_date: string;
  end_date: string;
  units: number;
  guests: number;
  total: number;
  status: string;
  details: { withDriver?: boolean; ticketTypeName?: string } | null;
  guest_name: string | null;
  guest_email: string | null;
  created_at: string;
  listings: { created_by: string | null; title: string; data: { scheduleTime?: string } } | null;
};

const GUEST_FALLBACK_AVATAR = "https://i.pravatar.cc/100?img=68";

function ledgerStatus(dbStatus: string, endISO: string, now: number): HostLedgerStatus {
  if (dbStatus === "cancelled" || dbStatus === "declined") return "cancelled";
  if (dbStatus === "pending") return "pending";
  if (dbStatus === "completed" || new Date(endISO).getTime() < now) return "completed";
  return "confirmed";
}

function detailFor(r: Row): string {
  const start = new Date(r.start_date);
  const end = new Date(r.end_date);
  if (r.kind === "stay") {
    const nights = nightsBetween(start, end);
    return `${nights} night${nights === 1 ? "" : "s"} · ${r.units} room${r.units === 1 ? "" : "s"}`;
  }
  if (r.kind === "car") {
    const days = daysBetween(start, end);
    return `${days} day${days === 1 ? "" : "s"} · ${r.details?.withDriver ? "with driver" : "self-drive"}`;
  }
  return `${r.units} × ${r.details?.ticketTypeName ?? "ticket"}`;
}

/** Fetch every booking on listings this host owns, joined to the listing. Filtered to owner uid. */
function useOwnedBookingRows(): { rows: Row[]; uid: string | null } {
  const { user } = useAuth();
  const uid = user?.id ?? null;
  const [rows, setRows] = useState<Row[]>([]);
  useEffect(() => {
    if (!uid) {
      setRows([]);
      return;
    }
    let active = true;
    createClient()
      .from("bookings")
      .select(
        "reference,kind,listing_id,start_date,end_date,units,guests,total,status,details,guest_name,guest_email,created_at,listings(created_by,title,data)"
      )
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (!active) return;
        // RLS returns owned-listing bookings + the host's own guest bookings; keep only the former.
        setRows(((data ?? []) as unknown as Row[]).filter((r) => r.listings?.created_by === uid));
      });
    return () => {
      active = false;
    };
  }, [uid]);
  return { rows, uid };
}

/** Unified ledger (experiences + stays + cars) for the signed-in host, from real bookings. */
export function useHostDbLedger(): HostLedgerEntry[] {
  const { rows } = useOwnedBookingRows();
  const [now] = useState(() => Date.now());

  return rows
    .filter((r) => r.kind === "stay" || r.kind === "car" || r.kind === "experience")
    .map((r) => ({
      id: r.reference,
      kind: r.kind as HostLedgerKind,
      listingId: r.listing_id,
      listingTitle: r.listings?.title ?? "Listing",
      guestName: r.guest_name ?? "Guest",
      guestEmail: r.guest_email ?? "",
      guestAvatar: GUEST_FALLBACK_AVATAR,
      dateISO: new Date(r.start_date).toISOString(),
      endISO: new Date(r.end_date).toISOString(),
      detail: detailFor(r),
      gross: r.total,
      status: ledgerStatus(r.status, r.end_date, now),
      createdAtISO: r.created_at,
    }))
    .sort((a, b) => new Date(b.dateISO).getTime() - new Date(a.dateISO).getTime());
}

function hostBookingStatus(dbStatus: string, dateISO: string, now: number): HostBooking["status"] {
  if (dbStatus === "cancelled" || dbStatus === "declined") return "cancelled";
  if (dbStatus === "completed" || new Date(dateISO).getTime() < now) return "attended";
  return "confirmed";
}

/** The host's experience bookings, shaped like the demo store, for the overview + check-in views. */
export function useHostDbExperienceBookings(): HostBooking[] {
  const { rows } = useOwnedBookingRows();
  const [now] = useState(() => Date.now());

  return rows
    .filter((r) => r.kind === "experience")
    .map((r) => ({
      id: r.reference,
      experienceId: r.listing_id,
      guestName: r.guest_name ?? "Guest",
      guestEmail: r.guest_email ?? "",
      guestAvatar: GUEST_FALLBACK_AVATAR,
      dateISO: new Date(r.start_date).toISOString(),
      scheduleTime: r.listings?.data?.scheduleTime ?? "",
      ticketTypeName: r.details?.ticketTypeName ?? "",
      quantity: r.units,
      total: r.total,
      status: hostBookingStatus(r.status, r.start_date, now),
      checkedIn: false,
      createdAtISO: r.created_at,
    }));
}
