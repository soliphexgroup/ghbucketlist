"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { hosts } from "@/data/hosts";
import { experiences } from "@/data/experiences";
import { useAllPlatformBookings } from "@/lib/admin-repository";
import { formatGHS } from "@/lib/format";

const pendingHostApplications = [
  {
    id: "ha-1",
    name: "Adjoa Serwaa",
    email: "adjoa.serwaa@example.com",
    interest: "Baking workshops",
    submittedDate: "2026-06-30",
  },
  {
    id: "ha-2",
    name: "Yaw Boateng",
    email: "yaw.boateng2@example.com",
    interest: "City cycling tours",
    submittedDate: "2026-06-27",
  },
];

export default function AdminHostsPage() {
  const bookings = useAllPlatformBookings();
  const [applications, setApplications] = useState(pendingHostApplications);

  const rows = useMemo(() => {
    return hosts.map((host) => {
      const hostExpIds = experiences.filter((e) => e.hostId === host.id).map((e) => e.id);
      const hostBookings = bookings.filter((b) => hostExpIds.includes(b.experienceId) && b.status !== "cancelled");
      const gross = hostBookings.reduce((sum, b) => sum + b.total, 0);
      return {
        ...host,
        activeListings: hostExpIds.length,
        totalBookings: hostBookings.length,
        totalEarnings: gross,
        commission: gross * 0.05,
      };
    });
  }, [bookings]);

  function decide(id: string) {
    setApplications((prev) => prev.filter((a) => a.id !== id));
  }

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-foreground">Hosts</h1>
      <p className="mt-1 text-muted-foreground">All hosts and pending applications.</p>

      <Tabs defaultValue="active" className="mt-6">
        <TabsList>
          <TabsTrigger value="active">Active Hosts ({rows.length})</TabsTrigger>
          <TabsTrigger value="pending">Pending Applications ({applications.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-4 overflow-x-auto rounded-2xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-secondary/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Host</th>
                <th className="px-4 py-3 font-medium">Listings</th>
                <th className="px-4 py-3 font-medium">Bookings</th>
                <th className="px-4 py-3 font-medium">Earnings</th>
                <th className="px-4 py-3 font-medium">Commission</th>
                <th className="px-4 py-3 font-medium">Joined</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((h) => (
                <tr key={h.id} className="border-t border-border">
                  <td className="flex items-center gap-2 px-4 py-3 text-foreground">
                    <Image src={h.avatarUrl} alt={h.name} width={28} height={28} className="size-7 rounded-full object-cover" />
                    {h.name}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{h.activeListings}</td>
                  <td className="px-4 py-3 text-muted-foreground">{h.totalBookings}</td>
                  <td className="px-4 py-3 text-foreground">{formatGHS(h.totalEarnings)}</td>
                  <td className="px-4 py-3 text-success">{formatGHS(h.commission)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{h.joinedYear}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TabsContent>

        <TabsContent value="pending" className="mt-4 flex flex-col gap-3">
          {applications.length === 0 ? (
            <p className="text-sm text-muted-foreground">No pending applications.</p>
          ) : (
            applications.map((app) => (
              <div key={app.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border p-4">
                <div>
                  <p className="font-medium text-foreground">{app.name}</p>
                  <p className="text-sm text-muted-foreground">{app.email} · Interested in: {app.interest}</p>
                  <p className="text-xs text-muted-foreground">
                    Submitted {new Date(app.submittedDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => decide(app.id)}>
                    Decline
                  </Button>
                  <Button size="sm" onClick={() => decide(app.id)}>
                    Approve
                  </Button>
                </div>
              </div>
            ))
          )}
        </TabsContent>
      </Tabs>

      <p className="mt-6 text-sm text-muted-foreground">
        Looking for a specific host&apos;s listings?{" "}
        <Link href="/dashboard/admin/experiences" className="text-primary hover:underline">
          View all experiences
        </Link>
      </p>
    </div>
  );
}
