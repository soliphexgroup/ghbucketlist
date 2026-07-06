"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
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
  const [ref, setRef] = useState("");

  const canSubmit = jobDescription.trim().length > 5 && address.trim().length > 0 && phone.trim().length > 0;

  function handleOpenChange(next: boolean) {
    onOpenChange(next);
    if (!next) {
      setTimeout(() => {
        setSubmitted(false);
        setJobDescription("");
        setPreferredDate("");
        setAddress("");
        setPhone("");
      }, 200);
    }
  }

  function submit() {
    if (!canSubmit) return;
    const ref2 = reference();
    setRef(ref2);
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
    setSubmitted(true);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        {!submitted ? (
          <>
            <DialogHeader>
              <DialogTitle>Request {provider.name}</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-4">
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
              <Button onClick={submit} disabled={!canSubmit} className="w-full sm:w-auto">
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
