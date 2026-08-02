"use client";

import { useMemo, useState } from "react";
import { Copy, Link2, Pause, Play, Pencil, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BrPartnerFormDialog } from "@/components/rewards/br-partner-form-dialog";
import { useAdminBrPartners, setBrPartnerStatus, type AdminBrPartner } from "@/lib/db-br-partners";
import { useBrRedemptions } from "@/lib/db-br-redemptions";
import { formatGHS } from "@/lib/format";
import { cn } from "@/lib/utils";

export default function AdminRewardsPage() {
  const { partners, refresh } = useAdminBrPartners();
  const { redemptions } = useBrRedemptions();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AdminBrPartner | undefined>(undefined);
  const [copied, setCopied] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const rollup = useMemo(() => {
    const m = new Map<string, { count: number; revenue: number; commission: number }>();
    for (const r of redemptions) {
      const cur = m.get(r.partnerId) ?? { count: 0, revenue: 0, commission: 0 };
      cur.count += 1;
      cur.revenue += r.amount;
      cur.commission += r.commission;
      m.set(r.partnerId, cur);
    }
    return m;
  }, [redemptions]);

  const totalCommission = redemptions.reduce((s, r) => s + r.commission, 0);
  const totalRevenue = redemptions.reduce((s, r) => s + r.amount, 0);

  function openAdd() {
    setEditing(undefined);
    setDialogOpen(true);
  }
  function openEdit(p: AdminBrPartner) {
    setEditing(p);
    setDialogOpen(true);
  }

  async function copyLink(p: AdminBrPartner) {
    const url = `${window.location.origin}/rewards/pos?t=${p.deviceToken}`;
    await navigator.clipboard.writeText(url);
    setCopied(p.id);
    setTimeout(() => setCopied((c) => (c === p.id ? null : c)), 2000);
  }

  async function toggleStatus(p: AdminBrPartner) {
    setBusy(p.id);
    setError(null);
    const res = await setBrPartnerStatus(p.id, p.status === "active" ? "paused" : "active");
    setBusy(null);
    if (!res.ok) return setError(res.message);
    refresh();
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Bucket Rewards</h1>
          <p className="mt-1 text-muted-foreground">Partner businesses, their device links, and redemptions.</p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="size-4" />
          Add partner
        </Button>
      </div>

      {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border p-4">
          <p className="text-xs text-muted-foreground">Partners</p>
          <p className="mt-1 font-heading text-xl font-bold text-foreground">{partners.length}</p>
        </div>
        <div className="rounded-2xl border border-border p-4">
          <p className="text-xs text-muted-foreground">Revenue driven</p>
          <p className="mt-1 font-heading text-xl font-bold text-foreground">{formatGHS(totalRevenue)}</p>
        </div>
        <div className="rounded-2xl bg-[linear-gradient(135deg,var(--brand-primary-gradient-from),var(--brand-primary-gradient-to))] p-4 text-primary-foreground">
          <p className="text-xs text-primary-foreground/80">Commission owed</p>
          <p className="mt-1 font-heading text-xl font-bold">{formatGHS(totalCommission)}</p>
        </div>
      </div>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-secondary/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Partner</th>
              <th className="px-4 py-3 font-medium">Split</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Redemptions</th>
              <th className="px-4 py-3 font-medium">Commission</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {partners.map((p) => {
              const r = rollup.get(p.id) ?? { count: 0, revenue: 0, commission: 0 };
              return (
                <tr key={p.id} className="border-t border-border">
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">{p.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {[p.category, p.area].filter(Boolean).join(" · ") || "—"}
                      {p.tier !== "starter" ? ` · ${p.tier}` : ""}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {p.totalDiscountPct}% → {p.customerPct}% / {p.commissionPct}%
                  </td>
                  <td className="px-4 py-3">
                    <Badge className={cn("capitalize", p.status === "active" ? "bg-success/10 text-success" : "bg-muted text-muted-foreground")}>
                      {p.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{r.count}</td>
                  <td className="px-4 py-3 text-foreground">{formatGHS(r.commission)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(p)} className="text-muted-foreground hover:text-foreground" aria-label="Edit partner">
                        <Pencil className="size-4" />
                      </button>
                      <button onClick={() => copyLink(p)} className="flex items-center gap-1 text-muted-foreground hover:text-foreground" aria-label="Copy device link">
                        {copied === p.id ? <span className="text-xs text-success">Copied!</span> : <Link2 className="size-4" />}
                      </button>
                      <button
                        onClick={() => toggleStatus(p)}
                        disabled={busy === p.id}
                        className="text-muted-foreground hover:text-foreground disabled:opacity-40"
                        aria-label={p.status === "active" ? "Pause partner" : "Activate partner"}
                      >
                        {p.status === "active" ? <Pause className="size-4" /> : <Play className="size-4" />}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {partners.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                  No partners yet. Add your first BR partner business.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
        <Copy className="size-3.5" /> The device link opens the counter redemption app pre-set to that partner — load it on their Bucket Rewards phone.
      </p>

      {dialogOpen && (
        <BrPartnerFormDialog
          key={editing?.id ?? "new"}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          existing={editing}
          onSaved={refresh}
        />
      )}
    </div>
  );
}
