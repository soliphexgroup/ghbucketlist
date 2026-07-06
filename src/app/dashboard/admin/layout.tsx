"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { Container } from "@/components/container";
import { AdminSidebarNav } from "@/components/dashboard/admin-sidebar";
import { AdminMobileNav } from "@/components/dashboard/admin-mobile-nav";
import { useAuth } from "@/lib/auth-context";

export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const { profile, loading } = useAuth();
  const router = useRouter();
  const isAdmin = profile?.role === "admin";

  useEffect(() => {
    if (!loading && profile && !isAdmin) {
      router.replace("/");
    }
  }, [loading, profile, isAdmin, router]);

  if (loading || !profile || !isAdmin) return null;

  return (
    <Container className="py-8 sm:py-10">
      <AdminMobileNav />

      <div className="mt-6 grid grid-cols-1 gap-8 lg:mt-0 lg:grid-cols-[260px_1fr]">
        <aside className="hidden lg:block">
          <div className="mb-6 flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <ShieldCheck className="size-4" />
            </span>
            <div>
              <p className="text-xs text-muted-foreground">Admin Panel</p>
              <p className="font-heading text-sm font-semibold text-foreground">Platform Control</p>
            </div>
          </div>
          <AdminSidebarNav />
        </aside>

        <div>{children}</div>
      </div>
    </Container>
  );
}
