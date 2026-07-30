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
import { useAdminBookings, setBookingStatus, type BookingDbStatus } from "@/lib/db-admin-bookings";
import { formatGHS } from "@/lib/format";
import { cn } from "@/lib/utils";

const statusStyles: Record<BookingDbStatus, string> = {
  pending: "bg-brand-coral/10 text-brand-coral",
  confirmed: "bg-success/10 text-success",
  completed: "bg-secondary text-secondary-foreground",
  cancelled: "bg-destructive/10 text-destructive",
  declined: "bg-destructive/10 text-destructive",
};

export default function AdminBookingsPage() {
  const { bookings, refresh } = useAdminBookings();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return bookings
      .filter((b) => (statusFilter === "all" ? true : b.status === statusFilter))
      .filter(
        (b) =>
          !q ||
          (b.guestName ?? "").toLowerCase().includes(q) ||
          (b.guestEmail ?? "").toLowerCase().includes(q) ||
          b.listingTitle.toLowerCase().includes(q) ||
          b.reference.toLowerCase().includes(q)
      );
  }, [bookings, query, statusFilter]);

  async function decide(reference: string, status: BookingDbStatus) {
    setBusy(reference);
    setError(null);
    const res = await setBookingStatus(reference, status);
    setBusy(null);
    if (!res.ok) {
      setError(res.message);
      return;
    }
    refresh();
  }

  function exportCsv() {
    const header = ["Reference", "Guest", "Kind", "Listing", "Start", "End", "Gross", "Platform Fee", "Net to Host", "Status"];
    const lines = rows.map((b) =>
      [
        b.reference,
        b.guestName ?? "",
        b.kind,
        b.listingTitle,
        b.startDate,
        b.endDate,
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

      {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

      <div className="mt-6 flex flex-wrap gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search reference, guest, listing…" className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
            <SelectItem value="declined">Declined</SelectItem>
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
              <th className="px-4 py-3 font-medium">Reference</th>
              <th className="px-4 py-3 font-medium">Guest</th>
              <th className="px-4 py-3 font-medium">Kind</th>
              <th className="px-4 py-3 font-medium">Listing</th>
              <th className="px-4 py-3 font-medium">Gross</th>
              <th className="px-4 py-3 font-medium">Net to host</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((b) => (
              <tr key={b.reference} className="border-t border-border">
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{b.reference}</td>
                <td className="px-4 py-3 text-foreground">{b.guestName ?? b.guestEmail ?? "—"}</td>
                <td className="px-4 py-3 capitalize text-muted-foreground">{b.kind}</td>
                <td className="px-4 py-3 text-muted-foreground">{b.listingTitle}</td>
                <td className="px-4 py-3 text-foreground">{formatGHS(b.total)}</td>
                <td className="px-4 py-3 text-success">{formatGHS(b.total * 0.95)}</td>
                <td className="px-4 py-3">
                  <Badge className={cn("capitalize", statusStyles[b.status])}>{b.status}</Badge>
                </td>
                <td className="px-4 py-3">
                  {b.status === "pending" ? (
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" disabled={busy === b.reference} onClick={() => decide(b.reference, "declined")}>
                        Decline
                      </Button>
                      <Button size="sm" disabled={busy === b.reference} onClick={() => decide(b.reference, "confirmed")}>
                        Confirm
                      </Button>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
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
