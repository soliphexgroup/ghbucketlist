"use client";

import { CalendarCheck, Gift, Star, UserPlus, Zap } from "lucide-react";
import { useBookings } from "@/lib/bookings-store";
import { useMyReviews } from "@/lib/reviews-store";
import { computeGpBalance, GP_PER_REVIEW } from "@/lib/gp";
import { cn } from "@/lib/utils";

const earnMethods = [
  {
    icon: CalendarCheck,
    title: "Book activities",
    description: "Earn 1 GP for every GHS 10 you spend.",
  },
  {
    icon: Star,
    title: "Leave a review",
    description: `Earn a flat ${GP_PER_REVIEW} GP per review.`,
  },
  {
    icon: UserPlus,
    title: "Refer a friend",
    description: "Earn 20 GP when they complete their first booking.",
  },
  {
    icon: Gift,
    title: "Birthday bonus",
    description: "Earn 10 GP automatically during your birthday month.",
  },
];

export default function LoyaltyPointsPage() {
  const bookings = useBookings();
  const reviews = useMyReviews();
  const balance = computeGpBalance(bookings, reviews);

  type Transaction = { id: string; label: string; amount: number; dateISO: string };

  const activeBookings = bookings.filter((b) => b.status !== "cancelled");

  const transactions: Transaction[] = [
    ...activeBookings.map((b) => ({
      id: `booking-${b.reference}`,
      label: `${b.experienceTitle} booking`,
      amount: b.gpEarned,
      dateISO: b.createdAtISO,
    })),
    ...activeBookings
      .filter((b) => b.gpRedeemed > 0)
      .map((b) => ({
        id: `redeem-${b.reference}`,
        label: `Redeemed on ${b.experienceTitle}`,
        amount: -b.gpRedeemed,
        dateISO: b.createdAtISO,
      })),
    ...reviews.map((r) => ({
      id: `review-${r.id}`,
      label: `Review: ${r.experienceTitle}`,
      amount: GP_PER_REVIEW,
      dateISO: r.createdAtISO,
    })),
  ].sort((a, b) => new Date(b.dateISO).getTime() - new Date(a.dateISO).getTime());

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-foreground">GH Bucketlist Points</h1>
      <p className="mt-1 text-muted-foreground">
        Earn points on every booking and redeem them for discounts.
      </p>

      <div className="mt-6 flex flex-col items-center gap-2 rounded-2xl bg-[linear-gradient(135deg,var(--brand-primary-gradient-from),var(--brand-primary-gradient-to))] p-8 text-center text-primary-foreground">
        <Zap className="size-8 fill-current" />
        <p className="font-heading text-4xl font-bold">{balance} GP</p>
        <p className="text-sm text-primary-foreground/80">
          100 GP = GHS 10 off your next booking
        </p>
      </div>

      <h2 className="mt-8 font-heading text-lg font-semibold text-foreground">How to earn</h2>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {earnMethods.map((method) => (
          <div key={method.title} className="rounded-2xl border border-border p-4">
            <span className="flex size-9 items-center justify-center rounded-full bg-secondary text-primary">
              <method.icon className="size-4" />
            </span>
            <p className="mt-3 font-medium text-foreground">{method.title}</p>
            <p className="mt-1 text-sm text-muted-foreground">{method.description}</p>
          </div>
        ))}
      </div>

      <h2 className="mt-8 font-heading text-lg font-semibold text-foreground">
        Transaction history
      </h2>
      {transactions.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">
          No GP activity yet — book an experience to start earning.
        </p>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-2xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-secondary/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Activity</th>
                <th className="px-4 py-3 text-right font-medium">GP</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((t) => (
                <tr key={t.id} className="border-t border-border">
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(t.dateISO).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-3 text-foreground">{t.label}</td>
                  <td
                    className={cn(
                      "px-4 py-3 text-right font-medium",
                      t.amount < 0 ? "text-destructive" : "text-success"
                    )}
                  >
                    {t.amount > 0 ? `+${t.amount}` : t.amount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
