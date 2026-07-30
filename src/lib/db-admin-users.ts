"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { WriteResult } from "@/lib/db-listings";
import type { UserRole } from "@/types/profile";

// Admin-only view of platform users. Email lives in auth.users, so reads go through the
// admin_list_users() SECURITY DEFINER RPC (guarded by is_admin()); status changes go through
// admin_set_user_status(). Both reject non-admins at the database.

export type UserStatus = "active" | "suspended";

export type AdminUser = {
  id: string;
  email: string | null;
  fullName: string | null;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
};

type Row = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: string;
  status: string;
  created_at: string;
};

function toUser(r: Row): AdminUser {
  return {
    id: r.id,
    email: r.email,
    fullName: r.full_name,
    role: (r.role as UserRole) ?? "customer",
    status: (r.status as UserStatus) ?? "active",
    createdAt: r.created_at,
  };
}

export async function setUserStatus(userId: string, status: UserStatus): Promise<WriteResult> {
  const supabase = createClient();
  const { error } = await supabase.rpc("admin_set_user_status", { p_user: userId, p_status: status });
  if (error) return { ok: false, reason: "error", message: error.message };
  return { ok: true };
}

/** Admin: all platform users, newest first. `refresh()` re-fetches after a change. */
export function useAdminUsers(): { users: AdminUser[]; loaded: boolean; refresh: () => void } {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let active = true;
    createClient()
      .rpc("admin_list_users")
      .then(({ data }) => {
        if (!active) return;
        setUsers(((data ?? []) as Row[]).map(toUser));
        setLoaded(true);
      });
    return () => {
      active = false;
    };
  }, [tick]);
  return { users, loaded, refresh: () => setTick((t) => t + 1) };
}
