"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  Compass,
  CalendarCheck,
  Star,
  Newspaper,
  MapPinned,
  Wallet,
  Tags,
  Zap,
  BarChart3,
  Settings,
  Bell,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/admin/users", label: "Users", icon: Users },
  { href: "/dashboard/admin/hosts", label: "Hosts", icon: Briefcase },
  { href: "/dashboard/admin/experiences", label: "Experiences / Listings", icon: Compass },
  { href: "/dashboard/admin/bookings", label: "Bookings", icon: CalendarCheck },
  { href: "/dashboard/admin/reviews", label: "Reviews", icon: Star },
  { href: "/dashboard/admin/blog", label: "Blog", icon: Newspaper },
  { href: "/dashboard/admin/trips", label: "Curated Trips", icon: MapPinned },
  { href: "/dashboard/admin/payouts", label: "Payouts", icon: Wallet },
  { href: "/dashboard/admin/categories", label: "Categories", icon: Tags },
  { href: "/dashboard/admin/points", label: "GP Points Management", icon: Zap },
  { href: "/dashboard/admin/reports", label: "Reports & Analytics", icon: BarChart3 },
  { href: "/dashboard/admin/settings", label: "Platform Settings", icon: Settings },
  { href: "/dashboard/admin/notifications", label: "Notifications", icon: Bell },
];

export function AdminSidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-0.5">
      {navItems.map((item) => {
        const active =
          item.href === "/dashboard/admin" ? pathname === item.href : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-200",
              active ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-secondary"
            )}
          >
            <item.icon className="size-4 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
