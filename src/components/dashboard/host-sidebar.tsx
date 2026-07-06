"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Compass,
  Building2,
  CalendarCheck,
  Users,
  Wallet,
  QrCode,
  Star,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard/host", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/host/experiences", label: "My Experiences", icon: Compass },
  { href: "/dashboard/host/properties", label: "My Properties", icon: Building2 },
  { href: "/dashboard/host/bookings", label: "Bookings", icon: CalendarCheck },
  { href: "/dashboard/host/guests", label: "Guests", icon: Users },
  { href: "/dashboard/host/earnings", label: "Earnings & Payouts", icon: Wallet },
  { href: "/dashboard/host/checkin", label: "QR Check-in", icon: QrCode },
  { href: "/dashboard/host/reviews", label: "Reviews", icon: Star },
];

export function HostSidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1">
      {navItems.map((item) => {
        const active =
          item.href === "/dashboard/host"
            ? pathname === item.href
            : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-200",
              active
                ? "bg-primary text-primary-foreground"
                : "text-foreground hover:bg-secondary"
            )}
          >
            <item.icon className="size-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
