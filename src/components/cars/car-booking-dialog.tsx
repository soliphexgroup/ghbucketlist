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
import { addCarBooking } from "@/lib/car-bookings-store";
import { getCarVendor } from "@/lib/car-repository";
import { usePaystackCheckout } from "@/hooks/use-paystack-checkout";
import { paystackReference } from "@/lib/paystack";
import type { Car } from "@/lib/car-types";

export type CarBookingDetails = {
  car: Car;
  pickupDate: Date;
  returnDate: Date;
  days: number;
  withDriver: boolean;
  dailyRate: number;
  subtotal: number;
  serviceFee: number;
  total: number;
};

export function CarBookingDialog({
  open,
  onOpenChange,
  details,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  details: CarBookingDetails | null;
}) {
  const [stage, setStage] = useState<"summary" | "processing" | "confirmed" | "requested" | "failed">("summary");
  const [message, setMessage] = useState("");
  const [payerEmail, setPayerEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [ref, setRef] = useState("");
  const checkout = usePaystackCheckout();

  if (!details) return null;

  const isInstant = details.car.bookingType === "instant";
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

  function completeCarBooking(reference: string, status: "confirmed" | "pending_request") {
    const bookingDetails = details;
    if (!bookingDetails) return;
    const vendor = getCarVendor(bookingDetails.car);
    addCarBooking({
      reference,
      carId: bookingDetails.car.id,
      carSlug: bookingDetails.car.slug,
      carTitle: `${bookingDetails.car.make} ${bookingDetails.car.model}`,
      carImage: bookingDetails.car.images[0],
      vendorName: vendor?.name ?? "",
      pickupLocation: bookingDetails.car.pickupLocation,
      city: bookingDetails.car.city,
      pickupDateISO: bookingDetails.pickupDate.toISOString(),
      returnDateISO: bookingDetails.returnDate.toISOString(),
      days: bookingDetails.days,
      withDriver: bookingDetails.withDriver,
      dailyRate: bookingDetails.dailyRate,
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
        completeCarBooking(ref2, "pending_request");
        setStage("requested");
      }, 1200);
      return;
    }

    if (!canPay) return;
    setStage("processing");
    const result = await checkout({
      email: payerEmail,
      amountGHS: bookingDetails.total,
      metadata: { carId: bookingDetails.car.id, kind: "car_booking" },
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

    completeCarBooking(result.reference, "confirmed");
    setRef(result.reference);
    setStage("confirmed");
  }

  const pickupLabel = details.pickupDate.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  const returnLabel = details.returnDate.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        {(stage === "summary" || stage === "processing") && (
          <DialogHeader>
            <DialogTitle>{isInstant ? "Confirm your rental" : "Request to book"}</DialogTitle>
          </DialogHeader>
        )}

        {stage === "summary" && (
          <div className="flex flex-col gap-4">
            <div>
              <p className="font-heading text-base font-semibold text-foreground">
                {details.car.make} {details.car.model}
              </p>
              <p className="text-sm text-muted-foreground">
                {pickupLabel} → {returnLabel} · {details.days} day{details.days > 1 ? "s" : ""}
              </p>
              <p className="text-sm text-muted-foreground">
                {details.withDriver ? "With chauffeur" : "Self-drive"} · {details.car.pickupLocation}
              </p>
            </div>

            <Separator />

            <div className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {formatGHS(details.dailyRate)} × {details.days} day{details.days > 1 ? "s" : ""}
                </span>
                <span className="font-medium text-foreground">{formatGHS(details.subtotal)}</span>
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
                <Label htmlFor="vendor-message" className="text-xs text-muted-foreground">
                  Message to vendor (optional)
                </Label>
                <Textarea
                  id="vendor-message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Let the vendor know about your trip…"
                  rows={2}
                  className="mt-1"
                />
              </div>
            )}

            {isInstant && (
              <div>
                <Label htmlFor="car-payer-email" className="text-xs text-muted-foreground">
                  Email for receipt
                </Label>
                <Input
                  id="car-payer-email"
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
                This is a request — you won&apos;t be charged unless the vendor accepts within 24 hours.
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
              <p className="font-heading text-lg font-semibold text-foreground">Rental confirmed</p>
              <p className="text-sm text-muted-foreground">We&apos;ve emailed your confirmation and pickup details.</p>
            </div>
            <p className="font-mono text-sm font-semibold tracking-wide text-foreground">{ref}</p>
            <div className="w-full rounded-xl bg-secondary/50 p-4 text-left text-sm">
              <p className="font-semibold text-foreground">
                {details.car.make} {details.car.model}
              </p>
              <p className="text-muted-foreground">
                {pickupLabel} → {returnLabel}
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
                The vendor has 24 hours to accept. You won&apos;t be charged unless they confirm.
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
