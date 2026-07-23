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
import { useHostLedger } from "@/lib/host-repository";
import { formatGHS } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { HostLedgerStatus } from "@/lib/host-types";

const statusStyles: Record<HostLedgerStatus, string> = {
  pending: "bg-brand-gold/15 text-brand-gold",
  confirmed: "bg-success/10 text-success",
  completed: "bg-secondary text-secondary-foreground",
  cancelled: "bg-destructive/10 text-destructive",
};

export default function HostBookingsPage() {
  const ledger = useHostLedger();
  const [overrides, setOverrides] = useState<Record<string, HostLedgerStatus>>({});
  const [query, setQuery] = useState("");
  const [kindFilter, setKindFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const rows = useMemo(() => {
    return ledger
      .map((e) => ({ ...e, status: overrides[e.id] ?? e.status }))
      .filter((e) => (kindFilter === "all" ? true : e.kind === kindFilter))
      .filter((e) => (statusFilter === "all" ? true : e.status === statusFilter))
      .filter((e) =>
        query.trim() ? e.guestName.toLowerCase().includes(query.trim().toLowerCase()) : true
      );
  }, [ledger, overrides, kindFilter, statusFilter, query]);

  function setStatus(id: string, status: HostLedgerStatus) {
    setOverrides((prev) => ({ ...prev, [id]: status }));
  }

  function exportCsv() {
    const header = ["Guest", "Email", "Type", "Listing", "Details", "Date", "Amount", "Status"];
    const lines = rows.map((e) =>
      [e.guestName, e.guestEmail, e.kind, e.listingTitle, e.detail, e.dateISO.slice(0, 10), e.gross, e.status].join(",")
    );
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
          <p className="mt-1 text-muted-foreground">All bookings across your experiences and stays.</p>
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
        <Select value={kindFilter} onValueChange={setKindFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="experience">Experiences</SelectItem>
            <SelectItem value="stay">Stays</SelectItem>
            <SelectItem value="car">Cars</SelectItem>
          </SelectContent>
        </Select>
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
              <th className="px-4 py-3 font-medium">Listing</th>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Amount</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((e) => (
              <tr key={e.id} className="border-t border-border">
                <td className="px-4 py-3 text-foreground">{e.guestName}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  <span className="flex items-center gap-2">
                    <span className="text-foreground">{e.listingTitle}</span>
                    <span className="rounded-full bg-secondary px-1.5 py-0.5 text-[10px] font-medium capitalize text-secondary-foreground">
                      {e.kind}
                    </span>
                  </span>
                  <span className="block text-xs text-muted-foreground">{e.detail}</span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {new Date(e.dateISO).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </td>
                <td className="px-4 py-3 text-foreground">{formatGHS(e.gross)}</td>
                <td className="px-4 py-3">
                  <Badge className={cn("capitalize", statusStyles[e.status])}>{e.status}</Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    {(e.status === "pending" || e.status === "confirmed") && (
                      <>
                        <button
                          onClick={() => setStatus(e.id, "completed")}
                          className="text-xs font-medium text-primary hover:underline"
                        >
                          Mark completed
                        </button>
                        <button
                          onClick={() => setStatus(e.id, "cancelled")}
                          className="text-xs font-medium text-destructive hover:underline"
                        >
                          Cancel
                        </button>
                      </>
                    )}
                    {e.status === "completed" && (
                      <button
                        onClick={() => setStatus(e.id, "cancelled")}
                        className="text-xs font-medium text-destructive hover:underline"
                      >
                        Issue refund
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
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
