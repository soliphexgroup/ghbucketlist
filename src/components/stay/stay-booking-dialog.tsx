"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, Clock, Loader2, XCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { formatGHS } from "@/lib/format";
import { addStayBooking } from "@/lib/stay-bookings-store";
import { getPropertyHost } from "@/lib/stay-repository";
import { usePaystackCheckout } from "@/hooks/use-paystack-checkout";
import { paystackReference } from "@/lib/paystack";
import type { Property } from "@/lib/stay-types";

export type StayBookingDetails = {
  property: Property;
  checkIn: Date;
  checkOut: Date;
  nights: number;
  adults: number;
  children: number;
  rooms: number;
  subtotal: number;
  cleaningFee: number;
  serviceFee: number;
  total: number;
};

export function StayBookingDialog({
  open,
  onOpenChange,
  details,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  details: StayBookingDetails | null;
}) {
  const [stage, setStage] = useState<"summary" | "processing" | "confirmed" | "requested" | "failed">("summary");
  const [message, setMessage] = useState("");
  const [payerEmail, setPayerEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [ref, setRef] = useState("");
  const checkout = usePaystackCheckout();

  if (!details) return null;

  const isInstant = details.property.bookingType === "instant";
  const canPay = payerEmail.includes("@") && payerEmail.includes(".");

  function handleOpenChange(next: boolean) {
    onOpenChange(next);
    if (!next) {
      setTimeout(() => {
        setStage("summary");
        setMessage("");
        setErrorMessage("");
      }, 200);
    }
  }

  function completeStayBooking(reference: string, status: "confirmed" | "pending_request") {
    const bookingDetails = details;
    if (!bookingDetails) return;
    const host = getPropertyHost(bookingDetails.property);
    addStayBooking({
      reference,
      propertyId: bookingDetails.property.id,
      propertySlug: bookingDetails.property.slug,
      propertyTitle: bookingDetails.property.title,
      propertyImage: bookingDetails.property.images[0],
      hostName: host?.name ?? "",
      neighbourhood: bookingDetails.property.neighbourhood,
      city: bookingDetails.property.city,
      checkInISO: bookingDetails.checkIn.toISOString(),
      checkOutISO: bookingDetails.checkOut.toISOString(),
      nights: bookingDetails.nights,
      guestsAdults: bookingDetails.adults,
      guestsChildren: bookingDetails.children,
      rooms: bookingDetails.rooms,
      nightlyRate: bookingDetails.property.pricePerNight,
      cleaningFee: bookingDetails.cleaningFee,
      total: bookingDetails.total,
      bookingType: isInstant ? "instant" : "request",
      status,
      createdAtISO: new Date().toISOString(),
    });
  }

  async function submit() {
    const bookingDetails = details;
    if (!bookingDetails) return;

    if (!isInstant) {
      const ref2 = paystackReference();
      setRef(ref2);
      setStage("processing");
      setTimeout(() => {
        completeStayBooking(ref2, "pending_request");
        setStage("requested");
      }, 1200);
      return;
    }

    if (!canPay) return;
    setStage("processing");
    const result = await checkout({
      email: payerEmail,
      amountGHS: bookingDetails.total,
      metadata: { propertyId: bookingDetails.property.id, kind: "stay_booking" },
    });

    if (!result.success) {
      if (result.reason === "cancelled") {
        setStage("summary");
        return;
      }
      setErrorMessage(result.message ?? "Payment could not be completed. Please try again.");
      setStage("failed");
      return;
    }

    completeStayBooking(result.reference, "confirmed");
    setRef(result.reference);
    setStage("confirmed");
  }

  const checkInLabel = details.checkIn.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  const checkOutLabel = details.checkOut.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        {(stage === "summary" || stage === "processing") && (
          <DialogHeader>
            <DialogTitle>{isInstant ? "Confirm your reservation" : "Request to book"}</DialogTitle>
          </DialogHeader>
        )}

        {stage === "summary" && (
          <div className="flex flex-col gap-4">
            <div>
              <p className="font-heading text-base font-semibold text-foreground">{details.property.title}</p>
              <p className="text-sm text-muted-foreground">
                {checkInLabel} → {checkOutLabel} · {details.nights} night{details.nights > 1 ? "s" : ""}
              </p>
              <p className="text-sm text-muted-foreground">
                {details.adults + details.children} guest{details.adults + details.children > 1 ? "s" : ""} ·{" "}
                {details.rooms} room{details.rooms > 1 ? "s" : ""}
              </p>
            </div>

            <Separator />

            <div className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {formatGHS(details.property.pricePerNight)} × {details.nights} night
                  {details.nights > 1 ? "s" : ""}
                  {details.rooms > 1 && ` × ${details.rooms} rooms`}
                </span>
                <span className="font-medium text-foreground">{formatGHS(details.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cleaning fee</span>
                <span className="font-medium text-foreground">{formatGHS(details.cleaningFee)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Service fee</span>
                <span className="font-medium text-foreground">{formatGHS(details.serviceFee)}</span>
              </div>
            </div>

            <Separator />

            <div className="flex justify-between text-base font-semibold text-foreground">
              <span>Total</span>
              <span>{formatGHS(details.total)}</span>
            </div>

            {!isInstant && (
              <div>
                <Label htmlFor="host-message" className="text-xs text-muted-foreground">
                  Message to host (optional)
                </Label>
                <Textarea
                  id="host-message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Let the host know why you're travelling…"
                  rows={2}
                  className="mt-1"
                />
              </div>
            )}

            {isInstant && (
              <div>
                <Label htmlFor="stay-payer-email" className="text-xs text-muted-foreground">
                  Email for receipt
                </Label>
                <Input
                  id="stay-payer-email"
                  type="email"
                  value={payerEmail}
                  onChange={(e) => setPayerEmail(e.target.value)}
                  placeholder="you@email.com"
                  className="mt-1.5"
                />
              </div>
            )}

            {!isInstant && (
              <p className="text-xs text-muted-foreground">
                This is a request — you won&apos;t be charged unless the host accepts within 24 hours.
              </p>
            )}
            {isInstant && (
              <p className="text-xs text-muted-foreground">
                You&apos;ll be securely redirected to Paystack to complete payment by card or mobile money.
              </p>
            )}

            <DialogFooter className="-mx-4 -mb-4 mt-2">
              <Button onClick={submit} disabled={isInstant && !canPay} className="w-full sm:w-auto">
                {isInstant ? `Pay ${formatGHS(details.total)}` : "Send Request"}
              </Button>
            </DialogFooter>
          </div>
        )}

        {stage === "processing" && (
          <div className="flex flex-col items-center gap-3 py-10">
            <Loader2 className="size-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              {isInstant ? "Waiting for Paystack…" : "Sending your request…"}
            </p>
          </div>
        )}

        {stage === "failed" && (
          <div className="flex flex-col items-center gap-4 py-4 text-center">
            <XCircle className="size-10 text-destructive" />
            <div>
              <p className="font-heading text-lg font-semibold text-foreground">Payment failed</p>
              <p className="mt-1 text-sm text-muted-foreground">{errorMessage}</p>
            </div>
            <Button className="w-full" onClick={() => setStage("summary")}>
              Try again
            </Button>
          </div>
        )}

        {stage === "confirmed" && (
          <div className="flex flex-col items-center gap-4 py-2 text-center">
            <CheckCircle2 className="size-10 text-success" />
            <div>
              <p className="font-heading text-lg font-semibold text-foreground">Reservation confirmed</p>
              <p className="text-sm text-muted-foreground">We&apos;ve emailed your confirmation and check-in details.</p>
            </div>
            <p className="font-mono text-sm font-semibold tracking-wide text-foreground">{ref}</p>
            <div className="w-full rounded-xl bg-secondary/50 p-4 text-left text-sm">
              <p className="font-semibold text-foreground">{details.property.title}</p>
              <p className="text-muted-foreground">
                {checkInLabel} → {checkOutLabel}
              </p>
            </div>
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

        {stage === "requested" && (
          <div className="flex flex-col items-center gap-4 py-2 text-center">
            <Clock className="size-10 text-brand-coral" />
            <div>
              <p className="font-heading text-lg font-semibold text-foreground">Request sent</p>
              <p className="text-sm text-muted-foreground">
                The host has 24 hours to accept. You won&apos;t be charged unless they confirm.
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
