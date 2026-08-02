"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createBrPartner,
  updateBrPartner,
  type AdminBrPartner,
  type BrTier,
} from "@/lib/db-br-partners";

export function BrPartnerFormDialog({
  open,
  onOpenChange,
  existing,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existing?: AdminBrPartner;
  onSaved: () => void;
}) {
  const [name, setName] = useState(existing?.name ?? "");
  const [category, setCategory] = useState(existing?.category ?? "");
  const [area, setArea] = useState(existing?.area ?? "");
  const [tier, setTier] = useState<BrTier>(existing?.tier ?? "starter");
  const [total, setTotal] = useState(String(existing?.totalDiscountPct ?? 10));
  const [customer, setCustomer] = useState(String(existing?.customerPct ?? 7));
  const [commission, setCommission] = useState(String(existing?.commissionPct ?? 3));
  const [description, setDescription] = useState(existing?.description ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalN = Number(total) || 0;
  const customerN = Number(customer) || 0;
  const commissionN = Number(commission) || 0;
  const splitOk = Math.abs(customerN + commissionN - totalN) < 0.001;
  const canSave = name.trim().length > 1 && totalN > 0 && splitOk;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSave || saving) return;
    setSaving(true);
    setError(null);
    const input = {
      name,
      category,
      area,
      tier,
      totalDiscountPct: totalN,
      customerPct: customerN,
      commissionPct: commissionN,
      description,
    };
    const res = existing ? await updateBrPartner(existing.id, input) : await createBrPartner(input);
    setSaving(false);
    if (!res.ok) return setError(res.message);
    onOpenChange(false);
    onSaved();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{existing ? "Edit partner" : "Add partner"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div>
            <Label htmlFor="p-name">Business name</Label>
            <Input id="p-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Mama&apos;s Kitchen" className="mt-1.5" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="p-cat">Category</Label>
              <Input id="p-cat" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="restaurant, salon…" className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="p-area">Area</Label>
              <Input id="p-area" value={area} onChange={(e) => setArea(e.target.value)} placeholder="Osu, East Legon…" className="mt-1.5" />
            </div>
          </div>
          <div>
            <Label>Tier</Label>
            <Select value={tier} onValueChange={(v) => setTier(v as BrTier)}>
              <SelectTrigger className="mt-1.5 w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="starter">Starter</SelectItem>
                <SelectItem value="featured">Featured</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label htmlFor="p-total">Total %</Label>
              <Input id="p-total" type="number" min={0} value={total} onChange={(e) => setTotal(e.target.value)} className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="p-cust">Customer %</Label>
              <Input id="p-cust" type="number" min={0} value={customer} onChange={(e) => setCustomer(e.target.value)} className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="p-comm">BR %</Label>
              <Input id="p-comm" type="number" min={0} value={commission} onChange={(e) => setCommission(e.target.value)} className="mt-1.5" />
            </div>
          </div>
          {!splitOk && (
            <p className="text-xs text-destructive">Customer % + BR % must equal Total % (e.g. 10 = 7 + 3).</p>
          )}
          <div>
            <Label htmlFor="p-desc">Description (optional)</Label>
            <Textarea id="p-desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="mt-1.5" />
          </div>
          <DialogFooter className="-mx-4 -mb-4 mt-2">
            <Button type="submit" disabled={!canSave || saving} className="w-full gap-2 sm:w-auto">
              {saving && <Loader2 className="size-4 animate-spin" />}
              {existing ? "Save changes" : "Add partner"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
