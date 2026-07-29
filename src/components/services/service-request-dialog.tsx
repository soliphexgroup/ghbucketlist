"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
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
import { addServiceRequest } from "@/lib/service-requests-store";
import { createServiceRequest } from "@/lib/db-service-requests";
import { useAuth } from "@/lib/auth-context";
import type { ServiceProvider } from "@/lib/service-types";

function reference() {
  return `GHB-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

export function ServiceRequestDialog({
  open,
  onOpenChange,
  provider,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  provider: ServiceProvider;
}) {
  const [jobDescription, setJobDescription] = useState("");
  const [preferredDate, setPreferredDate] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [needsSignin, setNeedsSignin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ref, setRef] = useState("");
  const { user } = useAuth();

  const canSubmit = jobDescription.trim().length > 5 && address.trim().length > 0 && phone.trim().length > 0;

  function handleOpenChange(next: boolean) {
    onOpenChange(next);
    if (!next) {
      setTimeout(() => {
        setSubmitted(false);
        setSubmitting(false);
        setNeedsSignin(false);
        setError(null);
        setJobDescription("");
        setPreferredDate("");
        setAddress("");
        setPhone("");
      }, 200);
    }
  }

  async function submit() {
    if (!canSubmit || submitting) return;
    // Requests are tied to the signed-in user so they show up in "My Bookings".
    if (!user) {
      setNeedsSignin(true);
      return;
    }

    setSubmitting(true);
    setError(null);
    const ref2 = reference();

    const res = await createServiceRequest({
      reference: ref2,
      provider,
      jobDescription: jobDescription.trim(),
      preferredDate: preferredDate.trim(),
      address: address.trim(),
      phone: phone.trim(),
    });
    if (!res.ok) {
      setSubmitting(false);
      if (res.reason === "signin") {
        setNeedsSignin(true);
        return;
      }
      setError(res.message);
      return;
    }

    // Keep a local copy so the transition period's dashboards stay consistent.
    addServiceRequest({
      reference: ref2,
      providerId: provider.id,
      providerSlug: provider.slug,
      providerName: provider.name,
      providerAvatar: provider.avatarUrl,
      category: provider.category,
      jobDescription: jobDescription.trim(),
      preferredDate: preferredDate.trim(),
      address: address.trim(),
      phone: phone.trim(),
      status: "pending",
      createdAtISO: new Date().toISOString(),
    });
    setRef(ref2);
    setSubmitting(false);
    setSubmitted(true);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        {needsSignin ? (
          <div className="flex flex-col items-center gap-4 py-4 text-center">
            <div>
              <p className="font-heading text-lg font-semibold text-foreground">Sign in to request</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Requests are tied to your account so you can track {provider.name}&apos;s reply in My
                Bookings.
              </p>
            </div>
            <Button asChild className="w-full">
              <Link href={`/login?next=/services/${provider.slug}`}>Sign in to continue</Link>
            </Button>
          </div>
        ) : !submitted ? (
          <>
            <DialogHeader>
              <DialogTitle>Request {provider.name}</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-4">
              {error && (
                <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
                  <AlertCircle className="mt-0.5 size-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
              <div>
                <Label htmlFor="job-description">What do you need done?</Label>
                <Textarea
                  id="job-description"
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Describe the job…"
                  rows={3}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="preferred-date">Preferred date</Label>
                <Input
                  id="preferred-date"
                  value={preferredDate}
                  onChange={(e) => setPreferredDate(e.target.value)}
                  placeholder="e.g. This Saturday morning"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="job-address">Address</Label>
                <Input
                  id="job-address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Where should they come?"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="job-phone">Phone number</Label>
                <Input
                  id="job-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 024 000 0000"
                  className="mt-1.5"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                This is a request — {provider.name} will confirm availability and quote a price before any work
                begins.
              </p>
            </div>
            <DialogFooter className="-mx-4 -mb-4 mt-2">
              <Button onClick={submit} disabled={!canSubmit || submitting} className="w-full gap-2 sm:w-auto">
                {submitting && <Loader2 className="size-4 animate-spin" />}
                Send Request
              </Button>
            </DialogFooter>
          </>
        ) : (
          <div className="flex flex-col items-center gap-4 py-4 text-center">
            <CheckCircle2 className="size-10 text-success" />
            <div>
              <p className="font-heading text-lg font-semibold text-foreground">Request sent</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {provider.name} typically responds within {provider.responseTimeMinutes} minutes.
              </p>
            </div>
            <p className="font-mono text-sm font-semibold tracking-wide text-foreground">{ref}</p>
            <div className="flex w-full flex-col gap-2">
              <Button variant="outline" asChild className="w-full">
                <Link href="/dashboard/user/bookings" onClick={() => handleOpenChange(false)}>
                  View in My Bookings
                </Link>
              </Button>
              <Button className="w-full" onClick={() => handleOpenChange(false)}>
                Done
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
