"use client";

import Link from "next/link";
import { AlertTriangle, Banknote, CalendarCheck, Compass, Users, Wallet } from "lucide-react";
import { EarningsSparkline } from "@/components/dashboard/earnings-sparkline";
import { useAllPlatformBookings } from "@/lib/admin-repository";
import { platformUsers } from "@/data/platform-users";
import { pendingListings } from "@/data/pending-listings";
import { experiences } from "@/data/experiences";
import { getExperienceCategory } from "@/lib/repository";
import { formatGHS } from "@/lib/format";

export default function AdminOverviewPage() {
  const bookings = useAllPlatformBookings();
  const active = bookings.filter((b) => b.status !== "cancelled");
  const grossRevenue = active.reduce((sum, b) => sum + b.total, 0);
  const platformEarnings = grossRevenue * 0.05;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const bookingsThisMonth = active.filter((b) => new Date(b.dateISO) >= startOfMonth).length;

  const customers = platformUsers.filter((u) => u.role === "customer");
  const hosts = platformUsers.filter((u) => u.role === "host");

  const revenueByCategory = new Map<string, number>();
  for (const b of active) {
    const exp = experiences.find((e) => e.id === b.experienceId);
    if (!exp) continue;
    const category = getExperienceCategory(exp);
    if (!category) continue;
    revenueByCategory.set(category.name, (revenueByCategory.get(category.name) ?? 0) + b.total);
  }
  const categoryRows = Array.from(revenueByCategory.entries()).sort((a, b) => b[1] - a[1]);
  const maxCategoryRevenue = Math.max(...categoryRows.map(([, v]) => v), 1);

  const days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (29 - i));
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const sparklinePoints = days.map((day) =>
    active
      .filter((b) => {
        const bd = new Date(b.dateISO);
        bd.setHours(0, 0, 0, 0);
        return bd.getTime() === day.getTime();
      })
      .reduce((sum, b) => sum + b.total, 0)
  );

  const recentBookings = [...active]
    .sort((a, b) => new Date(b.createdAtISO).getTime() - new Date(a.createdAtISO).getTime())
    .slice(0, 5);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="mt-1 text-muted-foreground">Platform-wide overview.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <KpiCard icon={Users} label="Total users" value={platformUsers.length} />
        <KpiCard icon={CalendarCheck} label="Bookings this month" value={bookingsThisMonth} />
        <KpiCard icon={Banknote} label="Gross revenue" value={formatGHS(grossRevenue)} />
        <KpiCard icon={Wallet} label="Platform earnings" value={formatGHS(platformEarnings)} />
        <KpiCard icon={Compass} label="Active listings" value={experiences.length} />
        <KpiCard icon={AlertTriangle} label="Pending approvals" value={pendingListings.length} accent />
      </div>

      <div className="rounded-2xl border border-border p-5">
        <h2 className="font-heading text-lg font-semibold text-foreground">Bookings & revenue — last 30 days</h2>
        <div className="mt-4">
          <EarningsSparkline points={sparklinePoints} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div>
          <h2 className="font-heading text-lg font-semibold text-foreground">Revenue by category</h2>
          <div className="mt-4 flex flex-col gap-3">
            {categoryRows.map(([name, revenue]) => (
              <div key={name}>
                <div className="flex justify-between text-sm">
                  <span className="text-foreground">{name}</span>
                  <span className="text-muted-foreground">{formatGHS(revenue)}</span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${(revenue / maxCategoryRevenue) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="font-heading text-lg font-semibold text-foreground">User type breakdown</h2>
          <div className="mt-4 flex flex-col gap-3">
            <BreakdownRow label="Customers" count={customers.length} total={platformUsers.length} color="#4B112C" />
            <BreakdownRow label="Hosts" count={hosts.length} total={platformUsers.length} color="#E8703A" />
          </div>

          <h2 className="mt-8 font-heading text-lg font-semibold text-foreground">Quick actions</h2>
          <div className="mt-4 flex flex-col gap-2">
            <Link href="/dashboard/admin/experiences" className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:border-primary">
              Approve pending listings ({pendingListings.length})
            </Link>
            <Link href="/dashboard/admin/payouts" className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:border-primary">
              Process pending payouts
            </Link>
            <Link href="/dashboard/admin/reviews" className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:border-primary">
              View flagged reviews
            </Link>
          </div>
        </div>
      </div>

      <div>
        <h2 className="font-heading text-lg font-semibold text-foreground">Recent activity</h2>
        <div className="mt-4 flex flex-col gap-2">
          {recentBookings.map((b) => {
            const exp = experiences.find((e) => e.id === b.experienceId);
            return (
              <div key={b.id} className="flex items-center justify-between rounded-lg border border-border px-4 py-3 text-sm">
                <span className="text-foreground">
                  <span className="font-medium">{b.guestName}</span> booked{" "}
                  <span className="font-medium">{exp?.title}</span>
                </span>
                <span className="text-muted-foreground">{formatGHS(b.total)}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function KpiCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  accent?: boolean;
}) {
  return (
    <div className={accent ? "rounded-2xl bg-[linear-gradient(135deg,var(--brand-primary-gradient-from),var(--brand-primary-gradient-to))] p-4 text-primary-foreground" : "rounded-2xl border border-border p-4"}>
      <Icon className={accent ? "size-5" : "size-5 text-primary"} />
      <p className="mt-3 font-heading text-xl font-bold">{value}</p>
      <p className={accent ? "text-xs text-primary-foreground/80" : "text-xs text-muted-foreground"}>{label}</p>
    </div>
  );
}

function BreakdownRow({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total ? Math.round((count / total) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between text-sm">
        <span className="text-foreground">{label}</span>
        <span className="text-muted-foreground">
          {count} ({pct}%)
        </span>
      </div>
      <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}
