"use client";

import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  useHostApplications,
  approveHostApplication,
  declineHostApplication,
} from "@/lib/db-host-applications";
import { useAdminUsers } from "@/lib/db-admin-users";
import { useAdminListings } from "@/lib/db-admin-listings";

export default function AdminHostsPage() {
  const { applications, refresh: refreshApps } = useHostApplications();
  const { users, refresh: refreshUsers } = useAdminUsers();
  const { listings } = useAdminListings();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pending = applications.filter((a) => a.status === "pending");

  const hostRows = useMemo(() => {
    const counts = new Map<string, number>();
    for (const l of listings) counts.set(l.hostId, (counts.get(l.hostId) ?? 0) + 1);
    return users
      .filter((u) => u.role === "host" || u.role === "admin")
      .map((u) => ({ ...u, listingCount: counts.get(u.id) ?? 0 }));
  }, [users, listings]);

  async function decide(id: string, approve: boolean) {
    setBusyId(id);
    setError(null);
    const res = approve ? await approveHostApplication(id) : await declineHostApplication(id);
    setBusyId(null);
    if (!res.ok) {
      setError(res.message);
      return;
    }
    // Approval flips a user's role → refresh both lists.
    refreshApps();
    refreshUsers();
  }

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-foreground">Hosts</h1>
      <p className="mt-1 text-muted-foreground">All hosts and pending applications.</p>

      {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

      <Tabs defaultValue="pending" className="mt-6">
        <TabsList>
          <TabsTrigger value="active">Active Hosts ({hostRows.length})</TabsTrigger>
          <TabsTrigger value="pending">Pending Applications ({pending.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-4 overflow-x-auto rounded-2xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-secondary/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Host</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Listings</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Joined</th>
              </tr>
            </thead>
            <tbody>
              {hostRows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">
                    No hosts yet.
                  </td>
                </tr>
              ) : (
                hostRows.map((h) => (
                  <tr key={h.id} className="border-t border-border">
                    <td className="px-4 py-3 text-foreground">{h.fullName ?? "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{h.email ?? "—"}</td>
                    <td className="px-4 py-3">
                      <Badge variant={h.role === "admin" ? "default" : "outline"}>{h.role}</Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{h.listingCount}</td>
                    <td className="px-4 py-3">
                      <span className={h.status === "suspended" ? "text-destructive" : "text-success"}>
                        {h.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(h.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </TabsContent>

        <TabsContent value="pending" className="mt-4 flex flex-col gap-3">
          {pending.length === 0 ? (
            <p className="text-sm text-muted-foreground">No pending applications.</p>
          ) : (
            pending.map((app) => (
              <div key={app.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border p-4">
                <div>
                  <p className="font-medium text-foreground">{app.fullName ?? app.email ?? "Applicant"}</p>
                  <p className="text-sm text-muted-foreground">
                    {app.email}
                    {app.phone ? ` · ${app.phone}` : ""}
                    {app.interest ? ` · Wants to host: ${app.interest}` : ""}
                  </p>
                  {app.message && <p className="mt-1 text-sm text-muted-foreground">{app.message}</p>}
                  <p className="text-xs text-muted-foreground">
                    Submitted {new Date(app.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" disabled={busyId === app.id} onClick={() => decide(app.id, false)}>
                    Decline
                  </Button>
                  <Button size="sm" disabled={busyId === app.id} onClick={() => decide(app.id, true)} className="gap-2">
                    {busyId === app.id && <Loader2 className="size-3.5 animate-spin" />}
                    Approve
                  </Button>
                </div>
              </div>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
