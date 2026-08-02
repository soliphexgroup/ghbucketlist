"use client";

import { useState } from "react";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { brSignup } from "@/lib/db-br-members";

export function BrSignupForm() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const canSubmit = phone.trim().replace(/\D/g, "").length >= 7;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    setError(null);
    const res = await brSignup(phone, name);
    setSubmitting(false);
    if (!res.ok) {
      setError(res.message);
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-6 text-center">
        <CheckCircle2 className="size-8 text-success" />
        <p className="font-heading text-base font-semibold text-foreground">You&apos;re in! 🎉</p>
        <p className="text-sm text-muted-foreground">
          At any BR partner, just ask for your <span className="font-medium text-foreground">Bucket Rewards</span>{" "}
          discount and give <span className="font-medium text-foreground">{phone.trim()}</span> — no app, no card.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <h2 className="font-heading text-lg font-semibold text-foreground">Join Bucket Rewards — free</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Register once with your phone number. Then just ask for your BR discount at any partner.
      </p>
      {error && (
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4">
        <div>
          <Label htmlFor="br-name">Name</Label>
          <Input id="br-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ama Mensah" className="mt-1.5" />
        </div>
        <div>
          <Label htmlFor="br-phone">Phone number</Label>
          <Input
            id="br-phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="024 000 0000"
            className="mt-1.5"
          />
        </div>
        <Button type="submit" className="w-full gap-2 sm:w-fit" disabled={!canSubmit || submitting}>
          {submitting && <Loader2 className="size-4 animate-spin" />}
          Join free
        </Button>
      </form>
    </div>
  );
}
