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
import { useHostExperiences, useHostBookings } from "@/lib/host-repository";
import { getExperienceById } from "@/data/experiences";
import { formatGHS } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { HostBookingStatus } from "@/lib/host-types";

const statusStyles: Record<HostBookingStatus, string> = {
  confirmed: "bg-success/10 text-success",
  attended: "bg-secondary text-secondary-foreground",
  cancelled: "bg-destructive/10 text-destructive",
  refunded: "bg-destructive/10 text-destructive",
};

export default function HostBookingsPage() {
  const experiences = useHostExperiences();
  const bookings = useHostBookings();
  const [overrides, setOverrides] = useState<Record<string, HostBookingStatus>>({});
  const [query, setQuery] = useState("");
  const [experienceFilter, setExperienceFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const rows = useMemo(() => {
    return bookings
      .map((b) => ({ ...b, status: overrides[b.id] ?? b.status }))
      .filter((b) => (experienceFilter === "all" ? true : b.experienceId === experienceFilter))
      .filter((b) => (statusFilter === "all" ? true : b.status === statusFilter))
      .filter((b) =>
        query.trim() ? b.guestName.toLowerCase().includes(query.trim().toLowerCase()) : true
      );
  }, [bookings, overrides, experienceFilter, statusFilter, query]);

  function setStatus(id: string, status: HostBookingStatus) {
    setOverrides((prev) => ({ ...prev, [id]: status }));
  }

  function exportCsv() {
    const header = ["Guest", "Email", "Activity", "Date", "Ticket Type", "Qty", "Amount", "Status"];
    const lines = rows.map((b) => {
      const exp = getExperienceById(b.experienceId);
      return [
        b.guestName,
        b.guestEmail,
        exp?.title ?? "",
        b.dateISO.slice(0, 10),
        b.ticketTypeName,
        b.quantity,
        b.total,
        b.status,
      ].join(",");
    });
    const csv = [header.join(","), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "gh-bucketlist-bookings.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Bookings</h1>
          <p className="mt-1 text-muted-foreground">All bookings across your experiences.</p>
        </div>
        <Button variant="outline" onClick={exportCsv}>
          <Download className="size-4" />
          Export to CSV
        </Button>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search guest name…"
            className="pl-9"
          />
        </div>
        <Select value={experienceFilter} onValueChange={setExperienceFilter}>
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="All activities" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All activities</SelectItem>
            {experiences.map((e) => (
              <SelectItem key={e.id} value={e.id}>
                {e.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
              <th className="px-4 py-3 font-medium">Guest</th>
              <th className="px-4 py-3 font-medium">Activity</th>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Qty</th>
              <th className="px-4 py-3 font-medium">Amount</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((b) => {
              const exp = getExperienceById(b.experienceId);
              return (
                <tr key={b.id} className="border-t border-border">
                  <td className="px-4 py-3 text-foreground">{b.guestName}</td>
                  <td className="px-4 py-3 text-muted-foreground">{exp?.title ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(b.dateISO).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{b.quantity}</td>
                  <td className="px-4 py-3 text-foreground">{formatGHS(b.total)}</td>
                  <td className="px-4 py-3">
                    <Badge className={cn("capitalize", statusStyles[b.status])}>{b.status}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      {b.status === "confirmed" && (
                        <>
                          <button
                            onClick={() => setStatus(b.id, "attended")}
                            className="text-xs font-medium text-primary hover:underline"
                          >
                            Mark attended
                          </button>
                          <button
                            onClick={() => setStatus(b.id, "cancelled")}
                            className="text-xs font-medium text-destructive hover:underline"
                          >
                            Cancel
                          </button>
                        </>
                      )}
                      {b.status === "attended" && (
                        <button
                          onClick={() => setStatus(b.id, "refunded")}
                          className="text-xs font-medium text-destructive hover:underline"
                        >
                          Issue refund
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">
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
