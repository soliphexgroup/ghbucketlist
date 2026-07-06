"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCurrentHostId, useCurrentHost, useHostBookings, platformFee, netPayout } from "@/lib/host-repository";
import { addPayout, usePayouts } from "@/lib/payouts-store";
import { getExperienceById } from "@/data/experiences";
import { formatGHS } from "@/lib/format";
import { cn } from "@/lib/utils";

const statusStyles = {
  pending: "bg-secondary text-secondary-foreground",
  approved: "bg-success/10 text-success",
  rejected: "bg-destructive/10 text-destructive",
};

export default function EarningsPage() {
  const host = useCurrentHost();
  const hostId = useCurrentHostId();
  const bookings = useHostBookings();
  const allPayouts = usePayouts();
  const payouts = allPayouts.filter((p) => p.hostId === hostId);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("mobile-money");

  const attended = bookings.filter((b) => b.status === "attended");
  const grossEarned = attended.reduce((sum, b) => sum + b.total, 0);
  const feeTotal = platformFee(grossEarned);
  const netEarned = grossEarned - feeTotal;
  const payoutsTotal = payouts
    .filter((p) => p.status !== "rejected")
    .reduce((sum, p) => sum + p.amount, 0);
  const availableBalance = Math.max(0, netEarned - payoutsTotal);

  function requestPayout() {
    const value = Number(amount);
    if (!value || value <= 0 || value > availableBalance) return;
    addPayout({
      id: `PO-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
      hostId,
      hostName: host.name,
      amount: value,
      method,
      requestedAtISO: new Date().toISOString(),
      status: "pending",
    });
    setAmount("");
    setDialogOpen(false);
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Earnings & Payouts</h1>
          <p className="mt-1 text-muted-foreground">Track your revenue and request payouts.</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <Button onClick={() => setDialogOpen(true)} disabled={availableBalance <= 0}>
            Request Payout
          </Button>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>Request payout</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-4">
              <p className="text-sm text-muted-foreground">
                Available balance: <span className="font-medium text-foreground">{formatGHS(availableBalance)}</span>
              </p>
              <div>
                <Label htmlFor="payout-amount">Amount (GHS)</Label>
                <Input
                  id="payout-amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  max={availableBalance}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>Payout method</Label>
                <Select value={method} onValueChange={setMethod}>
                  <SelectTrigger className="mt-1.5 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mobile-money">Mobile Money</SelectItem>
                    <SelectItem value="bank">Bank Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="-mx-4 -mb-4 mt-2">
              <Button onClick={requestPayout} className="w-full sm:w-auto">
                Confirm Request
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <SummaryCard label="Total earned" value={formatGHS(grossEarned)} />
        <SummaryCard label="Platform fee (5%)" value={`-${formatGHS(feeTotal)}`} />
        <SummaryCard label="Net payout" value={formatGHS(netEarned)} />
        <SummaryCard label="Available balance" value={formatGHS(availableBalance)} highlight />
      </div>

      <h2 className="mt-8 font-heading text-lg font-semibold text-foreground">Transaction history</h2>
      <div className="mt-4 overflow-x-auto rounded-2xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-secondary/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Guest</th>
              <th className="px-4 py-3 font-medium">Gross</th>
              <th className="px-4 py-3 font-medium">Fee</th>
              <th className="px-4 py-3 font-medium">Net</th>
            </tr>
          </thead>
          <tbody>
            {attended.map((b) => {
              const exp = getExperienceById(b.experienceId);
              return (
                <tr key={b.id} className="border-t border-border">
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(b.dateISO).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  </td>
                  <td className="px-4 py-3 text-foreground">
                    {b.guestName}
                    <span className="block text-xs text-muted-foreground">{exp?.title}</span>
                  </td>
                  <td className="px-4 py-3 text-foreground">{formatGHS(b.total)}</td>
                  <td className="px-4 py-3 text-muted-foreground">-{formatGHS(platformFee(b.total))}</td>
                  <td className="px-4 py-3 font-medium text-success">{formatGHS(netPayout(b.total))}</td>
                </tr>
              );
            })}
            {attended.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                  No completed sessions yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <h2 className="mt-8 font-heading text-lg font-semibold text-foreground">Payout history</h2>
      {payouts.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">No payouts requested yet.</p>
      ) : (
        <div className="mt-4 flex flex-col gap-3">
          {payouts.map((p) => (
            <div key={p.id} className="flex items-center justify-between rounded-xl border border-border p-3 text-sm">
              <div>
                <p className="font-medium text-foreground">{p.id}</p>
                <p className="text-muted-foreground">
                  {p.method === "mobile-money" ? "Mobile Money" : "Bank Transfer"} ·{" "}
                  {new Date(p.requestedAtISO).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-medium text-foreground">{formatGHS(p.amount)}</span>
                <Badge className={cn("capitalize", statusStyles[p.status])}>{p.status}</Badge>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SummaryCard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={highlight ? "rounded-2xl bg-[linear-gradient(135deg,var(--brand-primary-gradient-from),var(--brand-primary-gradient-to))] p-4 text-primary-foreground" : "rounded-2xl border border-border p-4"}>
      <p className={highlight ? "text-xs text-primary-foreground/80" : "text-xs text-muted-foreground"}>{label}</p>
      <p className="mt-1 font-heading text-xl font-bold">{value}</p>
    </div>
  );
}
