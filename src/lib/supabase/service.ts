import { createClient } from "@supabase/supabase-js";

// SERVER-ONLY. Uses the Supabase service-role key, which bypasses RLS — never import this into a
// "use client" file. Used inside API routes to look up data the caller can't read (e.g. a host's
// email from auth.users). Routes must authorize the caller before using it.

let cached: ReturnType<typeof createClient> | null = null;

/** Service-role client, or null if the key isn't configured yet. */
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  if (!cached) {
    cached = createClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return cached;
}

/** Look up a user's email by id (service role). Returns null if unavailable. */
export async function getUserEmail(userId: string | null | undefined): Promise<string | null> {
  if (!userId) return null;
  const svc = createServiceClient();
  if (!svc) return null;
  const { data, error } = await svc.auth.admin.getUserById(userId);
  if (error) return null;
  return data.user?.email ?? null;
}
