"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Download, Link2, Pause, Play, Pencil, Plus, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BrPartnerFormDialog } from "@/components/rewards/br-partner-form-dialog";
import { BrPartnerDetailDialog } from "@/components/rewards/br-partner-detail-dialog";
import {
  useAdminBrPartners,
  setBrPartnerStatus,
  type AdminBrPartner,
} from "@/lib/db-br-partners";
import { useBrRedemptions, useBrFailedRedemptions, settlePartner } from "@/lib/db-br-redemptions";
import { useBrMembers } from "@/lib/db-br-members";
import { formatGHS } from "@/lib/format";
import { cn } from "@/lib/utils";

const FLAG_MEMBER_PARTNERS = 4; // redeeming across this many distinct partners
const FLAG_MEMBER_COUNT = 10; // or this many total redemptions

const FAILED_REASON: Record<string, string> = {
  not_member: "Not a member",
  unknown_device: "Unknown device",
  invalid_amount: "Invalid amount",
};

export default function AdminRewardsPage() {
  const { partners, refresh } = useAdminBrPartners();
  const { redemptions, refresh: refreshRedemptions } = useBrRedemptions();
  const { failed: failedRedemptions } = useBrFailedRedemptions();
  const { members } = useBrMembers();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AdminBrPartner | undefined>(undefined);
  const [detail, setDetail] = useState<AdminBrPartner | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [redemptionQuery, setRedemptionQuery] = useState("");
  const [memberQuery, setMemberQuery] = useState("");

  const partnerNameById = useMemo(() => {
    const m = new Map<string, string>();
    for (const p of partners) m.set(p.id, p.name);
    return m;
  }, [partners]);

  // Per-partner rollup: redemptions, revenue, and unsettled ("owed") commission.
  const rollup = useMemo(() => {
    const m = new Map<string, { count: number; revenue: number; owed: number }>();
    for (const r of redemptions) {
      const cur = m.get(r.partnerId) ?? { count: 0, revenue: 0, owed: 0 };
      cur.count += 1;
      cur.revenue += r.amount;
      if (!r.settledAt) cur.owed += r.commission;
      m.set(r.partnerId, cur);
    }
    return m;
  }, [redemptions]);

  // Per-member activity, for the members tab + anti-abuse flags.
  const memberActivity = useMemo(() => {
    const m = new Map<string, { count: number; partners: Set<string>; total: number }>();
    for (const r of redemptions) {
      const cur = m.get(r.memberPhone) ?? { count: 0, partners: new Set<string>(), total: 0 };
      cur.count += 1;
      cur.partners.add(r.partnerId);
      cur.total += r.amount;
      m.set(r.memberPhone, cur);
    }
    return m;
  }, [redemptions]);

  const flags = useMemo(() => {
    const out: { phone: string; reason: string }[] = [];
    for (const [phone, a] of memberActivity) {
      if (a.partners.size >= FLAG_MEMBER_PARTNERS)
        out.push({ phone, reason: `Redeemed at ${a.partners.size} different partners` });
      else if (a.count >= FLAG_MEMBER_COUNT)
        out.push({ phone, reason: `${a.count} redemptions total` });
    }
    return out;
  }, [memberActivity]);

  const totalRevenue = redemptions.reduce((s, r) => s + r.amount, 0);
  const totalOwed = redemptions.filter((r) => !r.settledAt).reduce((s, r) => s + r.commission, 0);

  function openAdd() {
    setEditing(undefined);
    setDialogOpen(true);
  }
  function openEdit(p: AdminBrPartner) {
    setEditing(p);
    setDialogOpen(true);
  }

  async function copyLink(p: AdminBrPartner) {
    await navigator.clipboard.writeText(`${window.location.origin}/rewards/pos?t=${p.deviceToken}`);
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

  async function settle(p: AdminBrPartner) {
    setBusy(p.id);
    setError(null);
    const res = await settlePartner(p.id);
    setBusy(null);
    if (!res.ok) return setError(res.message);
    refreshRedemptions();
  }

  const shownRedemptions = useMemo(() => {
    const q = redemptionQuery.trim().toLowerCase();
    if (!q) return redemptions;
    return redemptions.filter(
      (r) =>
        r.memberPhone.toLowerCase().includes(q) ||
        (partnerNameById.get(r.partnerId) ?? "").toLowerCase().includes(q)
    );
  }, [redemptions, redemptionQuery, partnerNameById]);

  const shownMembers = useMemo(() => {
    const q = memberQuery.trim().toLowerCase();
    if (!q) return members;
    return members.filter((m) => m.phone.includes(q) || (m.name ?? "").toLowerCase().includes(q));
  }, [members, memberQuery]);

  function exportRedemptions() {
    const header = ["Date", "Partner", "Member", "Amount", "Customer saving", "Commission", "Settled"];
    const lines = shownRedemptions.map((r) =>
      [
        r.createdAt.slice(0, 10),
        (partnerNameById.get(r.partnerId) ?? "").replace(/,/g, " "),
        r.memberPhone,
        r.amount,
        r.customerSaving,
        r.commission,
        r.settledAt ? "yes" : "no",
      ].join(",")
    );
    const csv = [header.join(","), ...lines].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "bucket-rewards-redemptions.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Bucket Rewards</h1>
          <p className="mt-1 text-muted-foreground">Partners, device links, redemptions, and members.</p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="size-4" />
          Add partner
        </Button>
      </div>

      {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-4">
        <SummaryCard label="Partners" value={String(partners.length)} />
        <SummaryCard label="Members" value={String(members.length)} />
        <SummaryCard label="Revenue driven" value={formatGHS(totalRevenue)} />
        <SummaryCard label="Commission owed" value={formatGHS(totalOwed)} highlight />
      </div>

      <Tabs defaultValue="partners" className="mt-6">
        <TabsList>
          <TabsTrigger value="partners">Partners ({partners.length})</TabsTrigger>
          <TabsTrigger value="redemptions">Redemptions ({redemptions.length})</TabsTrigger>
          <TabsTrigger value="members">Members ({members.length})</TabsTrigger>
          <TabsTrigger value="failed">Failed offline ({failedRedemptions.length})</TabsTrigger>
        </TabsList>

        {/* Partners */}
        <TabsContent value="partners" className="mt-4 overflow-x-auto rounded-2xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-secondary/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Partner</th>
                <th className="px-4 py-3 font-medium">Split</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Redemptions</th>
                <th className="px-4 py-3 font-medium">Owed</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {partners.map((p) => {
                const r = rollup.get(p.id) ?? { count: 0, revenue: 0, owed: 0 };
                return (
                  <tr key={p.id} className="border-t border-border">
                    <td className="px-4 py-3">
                      <button onClick={() => setDetail(p)} className="text-left font-medium text-foreground hover:text-primary">
                        {p.name}
                      </button>
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
                    <td className="px-4 py-3 text-foreground">{formatGHS(r.owed)}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-2">
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
                        {r.owed > 0 && (
                          <Button size="sm" variant="outline" disabled={busy === p.id} onClick={() => settle(p)}>
                            Settle {formatGHS(r.owed)}
                          </Button>
                        )}
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
        </TabsContent>

        {/* Redemptions */}
        <TabsContent value="redemptions" className="mt-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative min-w-[220px] flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={redemptionQuery} onChange={(e) => setRedemptionQuery(e.target.value)} placeholder="Search member or partner…" className="pl-9" />
            </div>
            <Button variant="outline" onClick={exportRedemptions} disabled={shownRedemptions.length === 0}>
              <Download className="size-4" />
              Export CSV
            </Button>
          </div>
          <div className="mt-4 overflow-x-auto rounded-2xl border border-border">
            <table className="w-full text-sm">
              <thead className="bg-secondary/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Partner</th>
                  <th className="px-4 py-3 font-medium">Member</th>
                  <th className="px-4 py-3 font-medium">Amount</th>
                  <th className="px-4 py-3 font-medium">Saving</th>
                  <th className="px-4 py-3 font-medium">Commission</th>
                  <th className="px-4 py-3 font-medium">Settled</th>
                </tr>
              </thead>
              <tbody>
                {shownRedemptions.map((r) => (
                  <tr key={r.id} className="border-t border-border">
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(r.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-4 py-3 text-foreground">{partnerNameById.get(r.partnerId) ?? "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{r.memberPhone}</td>
                    <td className="px-4 py-3 text-foreground">{formatGHS(r.amount)}</td>
                    <td className="px-4 py-3 text-success">{formatGHS(r.customerSaving)}</td>
                    <td className="px-4 py-3 text-foreground">{formatGHS(r.commission)}</td>
                    <td className="px-4 py-3">
                      {r.settledAt ? (
                        <Badge className="bg-success/10 text-success">Settled</Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">Owed</span>
                      )}
                    </td>
                  </tr>
                ))}
                {shownRedemptions.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">
                      No redemptions yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* Members */}
        <TabsContent value="members" className="mt-4">
          {flags.length > 0 && (
            <div className="mb-4 rounded-2xl border border-brand-coral/30 bg-brand-coral/5 p-4">
              <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <AlertTriangle className="size-4 text-brand-coral" /> Needs review ({flags.length})
              </p>
              <ul className="mt-2 flex flex-col gap-1 text-sm text-muted-foreground">
                {flags.map((f) => (
                  <li key={f.phone}>
                    <span className="font-medium text-foreground">{f.phone}</span> — {f.reason}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="relative min-w-[220px] max-w-sm">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={memberQuery} onChange={(e) => setMemberQuery(e.target.value)} placeholder="Search name or phone…" className="pl-9" />
          </div>
          <div className="mt-4 overflow-x-auto rounded-2xl border border-border">
            <table className="w-full text-sm">
              <thead className="bg-secondary/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Phone</th>
                  <th className="px-4 py-3 font-medium">Joined</th>
                  <th className="px-4 py-3 font-medium">Redemptions</th>
                </tr>
              </thead>
              <tbody>
                {shownMembers.map((m) => (
                  <tr key={m.id} className="border-t border-border">
                    <td className="px-4 py-3 text-foreground">{m.name ?? "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{m.phone}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(m.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{memberActivity.get(m.phone)?.count ?? 0}</td>
                  </tr>
                ))}
                {shownMembers.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">
                      No members yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* Failed offline redemptions */}
        <TabsContent value="failed" className="mt-4">
          <p className="mb-3 text-sm text-muted-foreground">
            Offline sales that couldn&apos;t be confirmed when the device reconnected — usually a discount
            given to a number that isn&apos;t a member. Follow up with the partner.
          </p>
          <div className="overflow-x-auto rounded-2xl border border-border">
            <table className="w-full text-sm">
              <thead className="bg-secondary/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">When</th>
                  <th className="px-4 py-3 font-medium">Partner</th>
                  <th className="px-4 py-3 font-medium">Phone</th>
                  <th className="px-4 py-3 font-medium">Amount</th>
                  <th className="px-4 py-3 font-medium">Reason</th>
                </tr>
              </thead>
              <tbody>
                {failedRedemptions.map((f) => (
                  <tr key={f.id} className="border-t border-border">
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(f.occurredAt ?? f.createdAt).toLocaleString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-4 py-3 text-foreground">
                      {f.partnerId ? partnerNameById.get(f.partnerId) ?? "—" : "Unknown device"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{f.memberPhone ?? "—"}</td>
                    <td className="px-4 py-3 text-foreground">{f.amount != null ? formatGHS(f.amount) : "—"}</td>
                    <td className="px-4 py-3">
                      <Badge className="bg-destructive/10 text-destructive">
                        {FAILED_REASON[f.reason] ?? f.reason}
                      </Badge>
                    </td>
                  </tr>
                ))}
                {failedRedemptions.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                      No failed offline redemptions.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>

      {dialogOpen && (
        <BrPartnerFormDialog
          key={editing?.id ?? "new"}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          existing={editing}
          onSaved={refresh}
        />
      )}
      <BrPartnerDetailDialog partner={detail} redemptions={redemptions} onClose={() => setDetail(null)} />
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
