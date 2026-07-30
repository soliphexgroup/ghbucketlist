"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { WriteResult } from "@/lib/db-listings";

// Host onboarding is application-based: a signed-in customer applies, an admin approves, and the
// approve RPC flips their profiles.role to 'host'. Reads are RLS-scoped — applicants see their
// own application; admins see all.

export type HostApplicationStatus = "pending" | "approved" | "declined";

export type HostApplication = {
  id: string;
  userId: string;
  fullName: string | null;
  email: string | null;
  interest: string | null;
  phone: string | null;
  message: string | null;
  status: HostApplicationStatus;
  createdAt: string;
};

type Row = {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  interest: string | null;
  phone: string | null;
  message: string | null;
  status: string;
  created_at: string;
};

function toApplication(r: Row): HostApplication {
  return {
    id: r.id,
    userId: r.user_id,
    fullName: r.full_name,
    email: r.email,
    interest: r.interest,
    phone: r.phone,
    message: r.message,
    status: (r.status as HostApplicationStatus) ?? "pending",
    createdAt: r.created_at,
  };
}

export type SubmitApplicationInput = {
  fullName: string;
  email: string;
  interest: string;
  phone: string;
  message: string;
};

/** Submit a host application for the signed-in user. */
export async function submitHostApplication(input: SubmitApplicationInput): Promise<WriteResult> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return { ok: false, reason: "signin", message: "Please sign in to apply." };

  const { error } = await supabase.from("host_applications").insert({
    user_id: session.user.id,
    full_name: input.fullName || null,
    email: input.email || session.user.email || null,
    interest: input.interest || null,
    phone: input.phone || null,
    message: input.message || null,
  });
  if (error) return { ok: false, reason: "error", message: error.message };
  return { ok: true };
}

export async function approveHostApplication(id: string): Promise<WriteResult> {
  const supabase = createClient();
  const { error } = await supabase.rpc("approve_host_application", { p_id: id });
  if (error) return { ok: false, reason: "error", message: error.message };
  return { ok: true };
}

export async function declineHostApplication(id: string): Promise<WriteResult> {
  const supabase = createClient();
  const { error } = await supabase.rpc("decline_host_application", { p_id: id });
  if (error) return { ok: false, reason: "error", message: error.message };
  return { ok: true };
}

/** Admin: every application, newest first. `refresh()` re-fetches after a decision. */
export function useHostApplications(): { applications: HostApplication[]; refresh: () => void } {
  const [applications, setApplications] = useState<HostApplication[]>([]);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let active = true;
    createClient()
      .from("host_applications")
      .select("id,user_id,full_name,email,interest,phone,message,status,created_at")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (active) setApplications(((data ?? []) as Row[]).map(toApplication));
      });
    return () => {
      active = false;
    };
  }, [tick]);
  return { applications, refresh: () => setTick((t) => t + 1) };
}

/** The signed-in user's most recent application, or null. `loaded` distinguishes "none" from "loading". */
export function useMyHostApplication(): { application: HostApplication | null; loaded: boolean } {
  const [state, setState] = useState<{ application: HostApplication | null; loaded: boolean }>({
    application: null,
    loaded: false,
  });
  useEffect(() => {
    let active = true;
    createClient()
      .from("host_applications")
      .select("id,user_id,full_name,email,interest,phone,message,status,created_at")
      .order("created_at", { ascending: false })
      .limit(1)
      .then(({ data }) => {
        if (!active) return;
        const rows = (data ?? []) as Row[];
        setState({ application: rows[0] ? toApplication(rows[0]) : null, loaded: true });
      });
    return () => {
      active = false;
    };
  }, []);
  return state;
}
