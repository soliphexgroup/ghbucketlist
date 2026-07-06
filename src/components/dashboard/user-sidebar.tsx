"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarCheck,
  Heart,
  Star,
  Zap,
  Gift,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard/user", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/user/bookings", label: "My Bookings", icon: CalendarCheck },
  { href: "/dashboard/user/wishlist", label: "My Wishlist", icon: Heart },
  { href: "/dashboard/user/reviews", label: "My Reviews", icon: Star },
  { href: "/dashboard/user/points", label: "GH Bucketlist Points", icon: Zap },
  { href: "/dashboard/user/gifts", label: "Gifts", icon: Gift },
  { href: "/dashboard/user/settings", label: "Profile & Settings", icon: Settings },
];

export function UserSidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1">
      {navItems.map((item) => {
        const active =
          item.href === "/dashboard/user"
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
