"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CalendarCheck, Heart, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BookingTicketModal } from "@/components/dashboard/booking-ticket-modal";
import { useBookings, isUpcoming } from "@/lib/bookings-store";
import { useMyReviews } from "@/lib/reviews-store";
import { useWishlistIds } from "@/lib/wishlist-store";
import { computeGpBalance } from "@/lib/gp";
import { formatGHS } from "@/lib/format";

export default function DashboardOverviewPage() {
  const bookings = useBookings();
  const reviews = useMyReviews();
  const wishlist = useWishlistIds();
  const now = new Date();

  const upcoming = bookings.filter((b) => isUpcoming(b, now)).filter((b) => !b.isGift);
  const past = bookings.filter((b) => !isUpcoming(b, now) && b.status !== "cancelled");
  const gpBalance = computeGpBalance(bookings, reviews);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-secondary/40 p-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Welcome back</h1>
          <p className="mt-1 text-muted-foreground">Here&apos;s what&apos;s happening with your account.</p>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-primary-foreground">
          <Zap className="size-4 fill-current" />
          <span className="font-heading font-semibold">{gpBalance} GP</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard icon={CalendarCheck} label="Upcoming bookings" value={upcoming.length} />
        <StatCard icon={Sparkles} label="Past experiences" value={past.length} />
        <StatCard icon={Heart} label="Wishlist items" value={wishlist.length} />
      </div>

      <div>
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-lg font-semibold text-foreground">
            Upcoming bookings
          </h2>
          <Link
            href="/dashboard/user/bookings"
            className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            View all
            <ArrowRight className="size-3.5" />
          </Link>
        </div>

        {upcoming.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-border p-8 text-center">
            <p className="text-sm text-muted-foreground">
              No upcoming bookings yet. Time to discover something new.
            </p>
            <Button asChild className="mt-4">
              <Link href="/activities">Discover new experiences</Link>
            </Button>
          </div>
        ) : (
          <div className="mt-4 flex flex-col gap-3">
            {upcoming.slice(0, 3).map((b) => (
              <div
                key={b.reference}
                className="flex items-center gap-4 rounded-xl border border-border p-3"
              >
                <div className="relative size-16 shrink-0 overflow-hidden rounded-lg">
                  <Image src={b.experienceImage} alt={b.experienceTitle} fill className="object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-foreground">{b.experienceTitle}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(b.dateISO).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}{" "}
                    · {b.scheduleTime}
                  </p>
                  <p className="text-sm text-muted-foreground">{formatGHS(b.total)}</p>
                </div>
                <BookingTicketModal booking={b}>
                  <Button variant="outline" size="sm">
                    View ticket
                  </Button>
                </BookingTicketModal>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border p-5">
      <span className="flex size-10 items-center justify-center rounded-full bg-secondary text-primary">
        <Icon className="size-5" />
      </span>
      <div>
        <p className="font-heading text-2xl font-bold text-foreground">{value}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}
