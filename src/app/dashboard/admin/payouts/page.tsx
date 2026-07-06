"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { usePayouts, setPayoutStatus } from "@/lib/payouts-store";
import { useAllPlatformBookings } from "@/lib/admin-repository";
import { formatGHS } from "@/lib/format";
import { cn } from "@/lib/utils";

const statusStyles = {
  pending: "bg-secondary text-secondary-foreground",
  approved: "bg-success/10 text-success",
  rejected: "bg-destructive/10 text-destructive",
};

export default function AdminPayoutsPage() {
  const payouts = usePayouts();
  const bookings = useAllPlatformBookings();

  const active = bookings.filter((b) => b.status !== "cancelled");
  const platformEarningsRetained = active.reduce((sum, b) => sum + b.total * 0.05, 0);
  const disbursedTotal = payouts.filter((p) => p.status === "approved").reduce((sum, p) => sum + p.amount, 0);
  const pending = payouts.filter((p) => p.status === "pending");

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-foreground">Payouts</h1>
      <p className="mt-1 text-muted-foreground">Review and process host payout requests.</p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border p-4">
          <p className="text-xs text-muted-foreground">Pending requests</p>
          <p className="mt-1 font-heading text-xl font-bold text-foreground">{pending.length}</p>
        </div>
        <div className="rounded-2xl border border-border p-4">
          <p className="text-xs text-muted-foreground">Total disbursed (approved)</p>
          <p className="mt-1 font-heading text-xl font-bold text-foreground">{formatGHS(disbursedTotal)}</p>
        </div>
        <div className="rounded-2xl bg-[linear-gradient(135deg,var(--brand-primary-gradient-from),var(--brand-primary-gradient-to))] p-4 text-primary-foreground">
          <p className="text-xs text-primary-foreground/80">Platform earnings retained</p>
          <p className="mt-1 font-heading text-xl font-bold">{formatGHS(platformEarningsRetained)}</p>
        </div>
      </div>

      <h2 className="mt-8 font-heading text-lg font-semibold text-foreground">Payout queue</h2>
      {payouts.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">
          No payout requests yet — hosts can request payouts from their Earnings dashboard.
        </p>
      ) : (
        <div className="mt-4 flex flex-col gap-3">
          {payouts.map((p) => (
            <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border p-4">
              <div>
                <p className="font-medium text-foreground">{p.hostName}</p>
                <p className="text-sm text-muted-foreground">
                  {p.id} · {p.method === "mobile-money" ? "Mobile Money" : "Bank Transfer"} ·{" "}
                  {new Date(p.requestedAtISO).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-heading font-semibold text-foreground">{formatGHS(p.amount)}</span>
                <Badge className={cn("capitalize", statusStyles[p.status])}>{p.status}</Badge>
                {p.status === "pending" && (
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setPayoutStatus(p.id, "rejected")}>
                      Reject
                    </Button>
                    <Button size="sm" onClick={() => setPayoutStatus(p.id, "approved")}>
                      Approve
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
