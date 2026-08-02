"use client";

import { useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatGHS } from "@/lib/format";
import type { AdminBrPartner } from "@/lib/db-br-partners";
import type { BrRedemption } from "@/lib/db-br-redemptions";

export function BrPartnerDetailDialog({
  partner,
  redemptions,
  onClose,
}: {
  partner: AdminBrPartner | null;
  redemptions: BrRedemption[];
  onClose: () => void;
}) {
  const stats = useMemo(() => {
    if (!partner) return null;
    const rows = redemptions.filter((r) => r.partnerId === partner.id);
    const revenue = rows.reduce((s, r) => s + r.amount, 0);
    const commission = rows.reduce((s, r) => s + r.commission, 0);
    const owed = rows.filter((r) => !r.settledAt).reduce((s, r) => s + r.commission, 0);
    const perMember = new Map<string, number>();
    for (const r of rows) perMember.set(r.memberPhone, (perMember.get(r.memberPhone) ?? 0) + 1);
    const uniqueMembers = perMember.size;
    const repeat = Array.from(perMember.values()).filter((n) => n > 1).length;
    const repeatRate = uniqueMembers > 0 ? Math.round((repeat / uniqueMembers) * 100) : 0;
    return { rows, revenue, commission, owed, uniqueMembers, repeatRate };
  }, [partner, redemptions]);

  return (
    <Dialog open={!!partner} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{partner?.name}</DialogTitle>
        </DialogHeader>
        {partner && stats && (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat label="Redemptions" value={String(stats.rows.length)} />
              <Stat label="Revenue driven" value={formatGHS(stats.revenue)} />
              <Stat label="Customers" value={String(stats.uniqueMembers)} />
              <Stat label="Repeat rate" value={`${stats.repeatRate}%`} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Stat label="Commission owed" value={formatGHS(stats.owed)} highlight />
              <Stat label="Commission total" value={formatGHS(stats.commission)} />
            </div>

            <div>
              <p className="text-sm font-medium text-foreground">Recent redemptions</p>
              {stats.rows.length === 0 ? (
                <p className="mt-2 text-sm text-muted-foreground">No redemptions yet.</p>
              ) : (
                <div className="mt-2 flex flex-col gap-1.5">
                  {stats.rows.slice(0, 8).map((r) => (
                    <div key={r.id} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {new Date(r.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })} ·{" "}
                        {r.memberPhone}
                      </span>
                      <span className="text-foreground">
                        {formatGHS(r.amount)}{" "}
                        <span className="text-xs text-muted-foreground">(BR {formatGHS(r.commission)})</span>
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={highlight ? "rounded-lg bg-secondary/60 p-3" : "rounded-lg border border-border p-3"}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 font-heading text-base font-bold text-foreground">{value}</p>
    </div>
  );
}
