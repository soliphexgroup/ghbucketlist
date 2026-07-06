"use client";

import Image from "next/image";
import Link from "next/link";
import { CalendarCheck, Compass, Plus, Star, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EarningsSparkline } from "@/components/dashboard/earnings-sparkline";
import { useCurrentHost, useHostExperiences, useHostBookings } from "@/lib/host-repository";
import { getExperienceById } from "@/data/experiences";
import { formatGHS } from "@/lib/format";
import { cn } from "@/lib/utils";

const statusStyles: Record<string, string> = {
  confirmed: "bg-success/10 text-success",
  attended: "bg-secondary text-secondary-foreground",
  cancelled: "bg-destructive/10 text-destructive",
  refunded: "bg-destructive/10 text-destructive",
};

export default function HostOverviewPage() {
  const host = useCurrentHost();
  const experiences = useHostExperiences();
  const bookings = useHostBookings();
  const now = new Date();

  const activeBookings = bookings.filter((b) => b.status !== "cancelled" && b.status !== "refunded");
  const grossAllTime = activeBookings.reduce((sum, b) => sum + b.total, 0);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const thisMonthBookings = activeBookings.filter((b) => new Date(b.dateISO) >= startOfMonth);
  const grossThisMonth = thisMonthBookings.reduce((sum, b) => sum + b.total, 0);

  const avgRating =
    experiences.reduce((sum, e) => sum + e.rating, 0) / (experiences.length || 1);
  const totalReviews = experiences.reduce((sum, e) => sum + e.reviewCount, 0);

  const recentBookings = [...bookings]
    .sort((a, b) => new Date(b.createdAtISO).getTime() - new Date(a.createdAtISO).getTime())
    .slice(0, 5);

  const upcomingSessions = bookings
    .filter((b) => b.status === "confirmed" && new Date(b.dateISO) >= now)
    .reduce<Record<string, { experienceId: string; dateISO: string; scheduleTime: string; booked: number }>>(
      (acc, b) => {
        const key = `${b.experienceId}-${b.dateISO}`;
        if (!acc[key]) {
          acc[key] = { experienceId: b.experienceId, dateISO: b.dateISO, scheduleTime: b.scheduleTime, booked: 0 };
        }
        acc[key].booked += b.quantity;
        return acc;
      },
      {}
    );
  const sessionList = Object.values(upcomingSessions).sort(
    (a, b) => new Date(a.dateISO).getTime() - new Date(b.dateISO).getTime()
  );

  const days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (29 - i));
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const sparklinePoints = days.map((day) =>
    activeBookings
      .filter((b) => {
        const bd = new Date(b.dateISO);
        bd.setHours(0, 0, 0, 0);
        return bd.getTime() === day.getTime();
      })
      .reduce((sum, b) => sum + b.total, 0)
  );

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-secondary/40 p-6">
        <div className="flex items-center gap-3">
          <Image src={host.avatarUrl} alt={host.name} width={48} height={48} className="size-12 rounded-full object-cover" />
          <div>
            <h1 className="font-heading text-xl font-bold text-foreground">
              Welcome back, {host.name.split(" ")[0]}
            </h1>
            <p className="text-sm text-muted-foreground">Here&apos;s how your experiences are doing.</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href="/dashboard/host/bookings">View Bookings</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard/host/earnings">Get Payout</Link>
          </Button>
          <Button asChild>
            <Link href="/dashboard/host/experiences">
              <Plus className="size-4" />
              Add New Experience
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard label="Bookings this month" value={thisMonthBookings.length} icon={CalendarCheck} />
        <StatCard label="Earnings this month" value={formatGHS(grossThisMonth)} icon={Wallet} />
        <StatCard label="All-time earnings" value={formatGHS(grossAllTime)} icon={Wallet} />
        <StatCard label="Active listings" value={experiences.length} icon={Compass} />
        <StatCard label="Avg. rating" value={avgRating.toFixed(1)} icon={Star} sub={`${totalReviews} reviews`} />
      </div>

      <div className="rounded-2xl border border-border p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-lg font-semibold text-foreground">Earnings — last 30 days</h2>
          <span className="text-sm text-muted-foreground">{formatGHS(grossThisMonth)} this month</span>
        </div>
        <div className="mt-4">
          <EarningsSparkline points={sparklinePoints} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div>
          <h2 className="font-heading text-lg font-semibold text-foreground">Recent bookings</h2>
          <div className="mt-4 overflow-x-auto rounded-2xl border border-border">
            <table className="w-full text-sm">
              <thead className="bg-secondary/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Guest</th>
                  <th className="px-4 py-3 font-medium">Activity</th>
                  <th className="px-4 py-3 font-medium">Amount</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentBookings.map((b) => {
                  const exp = getExperienceById(b.experienceId);
                  return (
                    <tr key={b.id} className="border-t border-border">
                      <td className="px-4 py-3 text-foreground">{b.guestName}</td>
                      <td className="px-4 py-3 text-muted-foreground">{exp?.title ?? "—"}</td>
                      <td className="px-4 py-3 text-foreground">{formatGHS(b.total)}</td>
                      <td className="px-4 py-3">
                        <Badge className={cn("capitalize", statusStyles[b.status])}>{b.status}</Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h2 className="font-heading text-lg font-semibold text-foreground">Upcoming sessions</h2>
          <div className="mt-4 flex flex-col gap-3">
            {sessionList.length === 0 ? (
              <p className="text-sm text-muted-foreground">No upcoming sessions scheduled.</p>
            ) : (
              sessionList.slice(0, 6).map((session) => {
                const exp = getExperienceById(session.experienceId);
                if (!exp) return null;
                return (
                  <div
                    key={`${session.experienceId}-${session.dateISO}`}
                    className="flex items-center justify-between rounded-xl border border-border p-3"
                  >
                    <div>
                      <p className="font-medium text-foreground">{exp.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(session.dateISO).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                        })}{" "}
                        · {session.scheduleTime}
                      </p>
                    </div>
                    <span className="text-sm font-medium text-foreground">
                      {session.booked}/{exp.maxCapacity}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  sub,
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  sub?: string;
}) {
  return (
    <div className="rounded-2xl border border-border p-4">
      <span className="flex size-9 items-center justify-center rounded-full bg-secondary text-primary">
        <Icon className="size-4" />
      </span>
      <p className="mt-3 font-heading text-xl font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}
