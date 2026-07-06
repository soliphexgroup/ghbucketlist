"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTripInquiries, setInquiryStatus, type InquiryStatus, type TripTier } from "@/lib/trip-inquiries-store";
import { useTripTiers, setTripPrice } from "@/lib/trip-pricing-store";
import { cn } from "@/lib/utils";

const statusStyles: Record<InquiryStatus, string> = {
  new: "bg-brand-coral/10 text-brand-coral",
  in_progress: "bg-secondary text-secondary-foreground",
  completed: "bg-success/10 text-success",
  declined: "bg-destructive/10 text-destructive",
};

const statusLabels: Record<InquiryStatus, string> = {
  new: "New",
  in_progress: "In Progress",
  completed: "Completed",
  declined: "Declined",
};

export default function AdminTripsPage() {
  const inquiries = useTripInquiries();
  const tiers = useTripTiers();
  const [priceDrafts, setPriceDrafts] = useState<Partial<Record<TripTier, string>>>({});

  function savePrice(tierId: TripTier) {
    const value = Number(priceDrafts[tierId]);
    if (!value || value <= 0) return;
    setTripPrice(tierId, value);
    setPriceDrafts((prev) => ({ ...prev, [tierId]: "" }));
  }

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-foreground">Curated Trips</h1>
      <p className="mt-1 text-muted-foreground">Manage trip inquiries and service tier pricing.</p>

      <h2 className="mt-8 font-heading text-lg font-semibold text-foreground">Tier pricing</h2>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {tiers.map((tier) => (
          <div key={tier.id} className="rounded-2xl border border-border p-4">
            <p className="font-medium text-foreground">{tier.name}</p>
            <p className="mt-1 font-heading text-2xl font-bold text-foreground">${tier.price}</p>
            <div className="mt-3 flex gap-2">
              <Input
                type="number"
                placeholder="New price"
                value={priceDrafts[tier.id] ?? ""}
                onChange={(e) => setPriceDrafts((prev) => ({ ...prev, [tier.id]: e.target.value }))}
                className="h-8"
              />
              <button
                onClick={() => savePrice(tier.id)}
                className="shrink-0 rounded-lg border border-border px-3 text-sm font-medium text-foreground hover:border-primary"
              >
                Save
              </button>
            </div>
          </div>
        ))}
      </div>

      <h2 className="mt-8 font-heading text-lg font-semibold text-foreground">
        Inquiries ({inquiries.length})
      </h2>
      {inquiries.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">
          No trip inquiries yet — submissions from the public Curated Trips page will appear here.
        </p>
      ) : (
        <div className="mt-4 flex flex-col gap-3">
          {inquiries.map((inquiry) => (
            <div key={inquiry.id} className="flex flex-col gap-3 rounded-2xl border border-border p-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-foreground">{inquiry.name}</p>
                  <Badge className={cn("capitalize", statusStyles[inquiry.status])}>
                    {statusLabels[inquiry.status]}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{inquiry.email}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Tier: <span className="capitalize text-foreground">{inquiry.tier}</span> · Travel dates:{" "}
                  {inquiry.travelDates}
                </p>
                {inquiry.travelInterests && (
                  <p className="text-sm text-muted-foreground">Interests: {inquiry.travelInterests}</p>
                )}
                {inquiry.message && <p className="mt-1 text-sm text-muted-foreground">&ldquo;{inquiry.message}&rdquo;</p>}
                <p className="mt-1 text-xs text-muted-foreground">
                  Submitted {new Date(inquiry.createdAtISO).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                </p>
              </div>

              <Select value={inquiry.status} onValueChange={(value) => setInquiryStatus(inquiry.id, value as InquiryStatus)}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="declined">Declined</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
