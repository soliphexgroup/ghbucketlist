"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { platformUsers } from "@/data/platform-users";

type Adjustment = { id: string; userName: string; amount: number; reason: string; dateISO: string };

export default function AdminPointsPage() {
  const [ghsPerGp, setGhsPerGp] = useState("10");
  const [gpEarnRate, setGpEarnRate] = useState("10");
  const [expiryMonths, setExpiryMonths] = useState("12");
  const [saved, setSaved] = useState(false);

  const customers = platformUsers.filter((u) => u.role === "customer");
  const [userId, setUserId] = useState(customers[0]?.id ?? "");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [balances, setBalances] = useState<Record<string, number>>(
    Object.fromEntries(customers.map((u) => [u.id, u.gpBalance]))
  );
  const [log, setLog] = useState<Adjustment[]>([]);

  function saveSettings() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function applyAdjustment() {
    const value = Number(amount);
    if (!value || !userId) return;
    const user = customers.find((u) => u.id === userId);
    if (!user) return;
    setBalances((prev) => ({ ...prev, [userId]: (prev[userId] ?? 0) + value }));
    setLog((prev) => [
      { id: crypto.randomUUID(), userName: user.name, amount: value, reason: reason || "Manual adjustment", dateISO: new Date().toISOString() },
      ...prev,
    ]);
    setAmount("");
    setReason("");
  }

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-foreground">GP Points Management</h1>
      <p className="mt-1 text-muted-foreground">Configure platform-wide loyalty rules and adjust balances.</p>

      <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="rounded-2xl border border-border p-5">
          <h2 className="font-heading text-lg font-semibold text-foreground">Platform rules</h2>
          <div className="mt-4 flex flex-col gap-4">
            <div>
              <Label htmlFor="gp-earn-rate">GP earned per GHS spent</Label>
              <div className="mt-1.5 flex items-center gap-2">
                <span className="text-sm text-muted-foreground">1 GP per GHS</span>
                <Input id="gp-earn-rate" type="number" value={gpEarnRate} onChange={(e) => setGpEarnRate(e.target.value)} className="w-24" />
              </div>
            </div>
            <div>
              <Label htmlFor="ghs-per-gp">Redemption value</Label>
              <div className="mt-1.5 flex items-center gap-2">
                <span className="text-sm text-muted-foreground">100 GP = GHS</span>
                <Input id="ghs-per-gp" type="number" value={ghsPerGp} onChange={(e) => setGhsPerGp(e.target.value)} className="w-24" />
              </div>
            </div>
            <div>
              <Label htmlFor="expiry">Points expiry (months of inactivity)</Label>
              <Input id="expiry" type="number" value={expiryMonths} onChange={(e) => setExpiryMonths(e.target.value)} className="mt-1.5 w-24" />
            </div>
            <Button onClick={saveSettings} className="w-fit">
              {saved ? <Check className="size-4" /> : null}
              {saved ? "Saved" : "Save Settings"}
            </Button>
          </div>
        </div>

        <div className="rounded-2xl border border-border p-5">
          <h2 className="font-heading text-lg font-semibold text-foreground">Manual adjustment</h2>
          <div className="mt-4 flex flex-col gap-4">
            <div>
              <Label>Customer</Label>
              <Select value={userId} onValueChange={setUserId}>
                <SelectTrigger className="mt-1.5 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name} — {balances[u.id] ?? u.gpBalance} GP
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="adjust-amount">Amount (use negative to deduct)</Label>
              <Input id="adjust-amount" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="adjust-reason">Reason</Label>
              <Input id="adjust-reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Customer support goodwill credit" className="mt-1.5" />
            </div>
            <Button onClick={applyAdjustment} className="w-fit">
              Apply Adjustment
            </Button>
          </div>
        </div>
      </div>

      <h2 className="mt-8 font-heading text-lg font-semibold text-foreground">Adjustment log</h2>
      {log.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">No manual adjustments made this session.</p>
      ) : (
        <div className="mt-4 flex flex-col gap-2">
          {log.map((entry) => (
            <div key={entry.id} className="flex items-center justify-between rounded-lg border border-border px-4 py-3 text-sm">
              <div>
                <p className="font-medium text-foreground">{entry.userName}</p>
                <p className="text-muted-foreground">{entry.reason}</p>
              </div>
              <span className={entry.amount >= 0 ? "font-medium text-success" : "font-medium text-destructive"}>
                {entry.amount >= 0 ? `+${entry.amount}` : entry.amount} GP
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
