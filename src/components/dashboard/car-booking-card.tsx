"use client";

import Image from "next/image";
import Link from "next/link";
import { MapPin } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cancelCarBooking, type StoredCarBooking } from "@/lib/car-bookings-store";
import { formatGHS } from "@/lib/format";
import { cn } from "@/lib/utils";

const statusStyles: Record<StoredCarBooking["status"], string> = {
  confirmed: "bg-success/10 text-success",
  pending_request: "bg-brand-coral/10 text-brand-coral",
  declined: "bg-destructive/10 text-destructive",
  cancelled: "bg-destructive/10 text-destructive",
  completed: "bg-secondary text-secondary-foreground",
};

const statusLabels: Record<StoredCarBooking["status"], string> = {
  confirmed: "Confirmed",
  pending_request: "Awaiting vendor",
  declined: "Declined",
  cancelled: "Cancelled",
  completed: "Completed",
};

export function CarBookingCard({ booking }: { booking: StoredCarBooking }) {
  const pickup = new Date(booking.pickupDateISO);
  const dropoff = new Date(booking.returnDateISO);
  const canCancel = booking.status === "confirmed" || booking.status === "pending_request";

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border p-4 sm:flex-row">
      <Link href={`/cars/${booking.carSlug}`} className="relative h-40 shrink-0 overflow-hidden rounded-xl sm:h-auto sm:w-40">
        <Image src={booking.carImage} alt={booking.carTitle} fill className="object-cover" />
      </Link>

      <div className="flex flex-1 flex-col gap-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <Link href={`/cars/${booking.carSlug}`} className="font-heading text-base font-semibold text-foreground hover:text-primary">
              {booking.carTitle}
            </Link>
            <p className="text-sm text-muted-foreground">{booking.vendorName}</p>
          </div>
          <Badge className={cn("capitalize", statusStyles[booking.status])}>{statusLabels[booking.status]}</Badge>
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <span>
            {pickup.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })} →{" "}
            {dropoff.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
          </span>
          <span className="flex items-center gap-1">
            <MapPin className="size-3.5" />
            {booking.pickupLocation}
          </span>
        </div>

        <p className="text-sm text-muted-foreground">
          {booking.days} day{booking.days > 1 ? "s" : ""} · {booking.withDriver ? "With chauffeur" : "Self-drive"} ·{" "}
          {formatGHS(booking.total)}
        </p>

        {canCancel && (
          <div className="mt-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                  Cancel
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Cancel this rental?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will cancel your rental of {booking.carTitle}. Refund eligibility depends on the
                    vendor&apos;s cancellation policy.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Keep booking</AlertDialogCancel>
                  <AlertDialogAction onClick={() => cancelCarBooking(booking.reference)}>
                    Yes, cancel
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </div>
    </div>
  );
}
