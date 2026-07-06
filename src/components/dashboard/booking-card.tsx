"use client";

import Image from "next/image";
import Link from "next/link";
import { CalendarPlus, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { BookingTicketModal } from "@/components/dashboard/booking-ticket-modal";
import { WriteReviewDialog } from "@/components/dashboard/write-review-dialog";
import { cancelBooking, type StoredBooking } from "@/lib/bookings-store";
import { hasReviewed } from "@/lib/reviews-store";
import { buildGoogleCalendarLink } from "@/lib/calendar-link";
import { formatGHS } from "@/lib/format";
import { cn } from "@/lib/utils";

const statusStyles: Record<StoredBooking["status"], string> = {
  confirmed: "bg-success/10 text-success",
  attended: "bg-secondary text-secondary-foreground",
  cancelled: "bg-destructive/10 text-destructive",
};

export function BookingCard({
  booking,
  variant,
}: {
  booking: StoredBooking;
  variant: "upcoming" | "past" | "cancelled";
}) {
  const dateLabel = new Date(booking.dateISO).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const calendarLink = buildGoogleCalendarLink({
    title: booking.experienceTitle,
    dateISO: booking.dateISO,
    scheduleTime: booking.scheduleTime,
    durationMinutes: booking.durationMinutes,
    location: `${booking.venueName}, ${booking.neighbourhood}`,
    details: `Booking reference: ${booking.reference}`,
  });

  const alreadyReviewed = hasReviewed(booking.reference);

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border p-4 sm:flex-row">
      <Link href={`/activities/${booking.experienceSlug}`} className="relative h-40 shrink-0 overflow-hidden rounded-xl sm:h-auto sm:w-40">
        <Image src={booking.experienceImage} alt={booking.experienceTitle} fill className="object-cover" />
      </Link>

      <div className="flex flex-1 flex-col gap-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <Link
              href={`/activities/${booking.experienceSlug}`}
              className="font-heading text-base font-semibold text-foreground hover:text-primary"
            >
              {booking.experienceTitle}
            </Link>
            <p className="text-sm text-muted-foreground">{booking.hostName}</p>
          </div>
          <Badge className={cn("capitalize", statusStyles[booking.status])}>
            {booking.status}
          </Badge>
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <span>
            {dateLabel} · {booking.scheduleTime}
          </span>
          <span className="flex items-center gap-1">
            <MapPin className="size-3.5" />
            {booking.neighbourhood}
          </span>
        </div>

        <p className="text-sm text-muted-foreground">
          {booking.ticketTypeName} · Qty {booking.quantity} · {formatGHS(booking.total)}
        </p>

        <div className="mt-2 flex flex-wrap gap-2">
          {variant !== "cancelled" && (
            <BookingTicketModal booking={booking}>
              <Button variant="outline" size="sm">
                View QR Ticket
              </Button>
            </BookingTicketModal>
          )}

          {variant === "upcoming" && (
            <>
              <Button variant="outline" size="sm" asChild>
                <a href={calendarLink} target="_blank" rel="noreferrer">
                  <CalendarPlus className="size-3.5" />
                  Add to Calendar
                </a>
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                    Cancel Booking
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Cancel this booking?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will cancel your booking for {booking.experienceTitle} on {dateLabel}.
                      This action can&apos;t be undone in this demo.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Keep booking</AlertDialogCancel>
                    <AlertDialogAction onClick={() => cancelBooking(booking.reference)}>
                      Yes, cancel
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}

          {variant === "past" &&
            (alreadyReviewed ? (
              <Badge variant="secondary">Reviewed</Badge>
            ) : (
              <WriteReviewDialog booking={booking}>
                <Button size="sm">Write a Review</Button>
              </WriteReviewDialog>
            ))}
        </div>
      </div>
    </div>
  );
}
