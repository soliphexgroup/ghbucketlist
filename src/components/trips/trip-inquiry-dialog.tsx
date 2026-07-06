"use client";

import { useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { addTripInquiry, type TripTier } from "@/lib/trip-inquiries-store";
import type { TripTierInfo } from "@/data/trip-tiers";

export function TripInquiryDialog({
  open,
  onOpenChange,
  tiers,
  defaultTier,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tiers: TripTierInfo[];
  defaultTier: TripTier;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [tier, setTier] = useState<TripTier>(defaultTier);
  const [travelDates, setTravelDates] = useState("");
  const [travelInterests, setTravelInterests] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const canSubmit = name.trim().length > 1 && email.includes("@") && travelDates.trim().length > 0;

  function handleOpenChange(next: boolean) {
    onOpenChange(next);
    if (!next) {
      setTimeout(() => {
        setSubmitted(false);
        setName("");
        setEmail("");
        setTravelDates("");
        setTravelInterests("");
        setMessage("");
        setTier(defaultTier);
      }, 200);
    }
  }

  function submit() {
    if (!canSubmit) return;
    addTripInquiry({
      id: crypto.randomUUID(),
      name: name.trim(),
      email: email.trim(),
      tier,
      travelDates: travelDates.trim(),
      travelInterests: travelInterests.trim(),
      message: message.trim(),
      status: "new",
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
              <DialogTitle>Plan your trip</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-4">
              <div>
                <Label htmlFor="trip-name">Full name</Label>
                <Input id="trip-name" value={name} onChange={(e) => setName(e.target.value)} className="mt-1.5" />
              </div>
              <div>
                <Label htmlFor="trip-email">Email</Label>
                <Input
                  id="trip-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>Service tier</Label>
                <Select value={tier} onValueChange={(value) => setTier(value as TripTier)}>
                  <SelectTrigger className="mt-1.5 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {tiers.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name} — ${t.price}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="trip-dates">Travel dates</Label>
                <Input
                  id="trip-dates"
                  value={travelDates}
                  onChange={(e) => setTravelDates(e.target.value)}
                  placeholder="e.g. 12–20 September 2026"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="trip-interests">Travel interests</Label>
                <Input
                  id="trip-interests"
                  value={travelInterests}
                  onChange={(e) => setTravelInterests(e.target.value)}
                  placeholder="e.g. food, history, beaches"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="trip-message">Anything else? (optional)</Label>
                <Textarea
                  id="trip-message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                  className="mt-1.5"
                />
              </div>
            </div>
            <DialogFooter className="-mx-4 -mb-4 mt-2">
              <Button onClick={submit} disabled={!canSubmit} className="w-full sm:w-auto">
                Submit Inquiry
              </Button>
            </DialogFooter>
          </>
        ) : (
          <div className="flex flex-col items-center gap-4 py-4 text-center">
            <CheckCircle2 className="size-10 text-success" />
            <div>
              <p className="font-heading text-lg font-semibold text-foreground">Inquiry sent</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Thanks, {name.split(" ")[0]}! Our trip planning team will reach out to {email} within
                1–2 business days.
              </p>
            </div>
            <Button className="w-full" onClick={() => handleOpenChange(false)}>
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
