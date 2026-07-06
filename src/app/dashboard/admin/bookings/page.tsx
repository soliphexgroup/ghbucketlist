"use client";

import { useMemo, useState } from "react";
import { Download, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAllPlatformBookings } from "@/lib/admin-repository";
import { getExperienceById } from "@/data/experiences";
import { getExperienceHost } from "@/lib/repository";
import { formatGHS } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { HostBookingStatus } from "@/lib/host-types";

const statusStyles: Record<HostBookingStatus, string> = {
  confirmed: "bg-success/10 text-success",
  attended: "bg-secondary text-secondary-foreground",
  cancelled: "bg-destructive/10 text-destructive",
  refunded: "bg-destructive/10 text-destructive",
};

export default function AdminBookingsPage() {
  const bookings = useAllPlatformBookings();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const rows = useMemo(() => {
    return bookings
      .map((b) => {
        const exp = getExperienceById(b.experienceId);
        const host = exp ? getExperienceHost(exp) : undefined;
        return { ...b, experienceTitle: exp?.title ?? "—", hostName: host?.name ?? "—" };
      })
      .filter((b) => (statusFilter === "all" ? true : b.status === statusFilter))
      .filter(
        (b) =>
          !query.trim() ||
          b.guestName.toLowerCase().includes(query.trim().toLowerCase()) ||
          b.hostName.toLowerCase().includes(query.trim().toLowerCase()) ||
          b.experienceTitle.toLowerCase().includes(query.trim().toLowerCase()) ||
          b.id.toLowerCase().includes(query.trim().toLowerCase())
      );
  }, [bookings, query, statusFilter]);

  function exportCsv() {
    const header = ["Booking ID", "Guest", "Host", "Activity", "Date", "Gross", "Platform Fee", "Net to Host", "Status"];
    const lines = rows.map((b) =>
      [
        b.id,
        b.guestName,
        b.hostName,
        b.experienceTitle,
        b.dateISO.slice(0, 10),
        b.total,
        (b.total * 0.05).toFixed(2),
        (b.total * 0.95).toFixed(2),
        b.status,
      ].join(",")
    );
    const csv = [header.join(","), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "gh-bucketlist-all-bookings.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Bookings</h1>
          <p className="mt-1 text-muted-foreground">Every booking across every host.</p>
        </div>
        <Button variant="outline" onClick={exportCsv}>
          <Download className="size-4" />
          Export to CSV
        </Button>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search booking, guest, host, activity…" className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="attended">Attended</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
            <SelectItem value="refunded">Refunded</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <p className="mt-4 text-sm text-muted-foreground">
        Showing {rows.length} booking{rows.length === 1 ? "" : "s"}
      </p>

      <div className="mt-2 overflow-x-auto rounded-2xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-secondary/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Booking</th>
              <th className="px-4 py-3 font-medium">Guest</th>
              <th className="px-4 py-3 font-medium">Host</th>
              <th className="px-4 py-3 font-medium">Activity</th>
              <th className="px-4 py-3 font-medium">Gross</th>
              <th className="px-4 py-3 font-medium">Fee (5%)</th>
              <th className="px-4 py-3 font-medium">Net to host</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((b) => (
              <tr key={b.id} className="border-t border-border">
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{b.id}</td>
                <td className="px-4 py-3 text-foreground">{b.guestName}</td>
                <td className="px-4 py-3 text-muted-foreground">{b.hostName}</td>
                <td className="px-4 py-3 text-muted-foreground">{b.experienceTitle}</td>
                <td className="px-4 py-3 text-foreground">{formatGHS(b.total)}</td>
                <td className="px-4 py-3 text-muted-foreground">{formatGHS(b.total * 0.05)}</td>
                <td className="px-4 py-3 text-success">{formatGHS(b.total * 0.95)}</td>
                <td className="px-4 py-3">
                  <Badge className={cn("capitalize", statusStyles[b.status])}>{b.status}</Badge>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-muted-foreground">
                  No bookings match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
