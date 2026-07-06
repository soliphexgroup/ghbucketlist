"use client";

import Image from "next/image";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Container } from "@/components/container";
import { HostSidebarNav } from "@/components/dashboard/host-sidebar";
import { HostMobileNav } from "@/components/dashboard/host-mobile-nav";
import { useAuth } from "@/lib/auth-context";
import { useCurrentHost } from "@/lib/host-repository";

export default function HostDashboardLayout({ children }: { children: React.ReactNode }) {
  const { profile, loading } = useAuth();
  const router = useRouter();
  const host = useCurrentHost();
  const isHost = profile?.role === "host" || profile?.role === "admin";

  useEffect(() => {
    if (!loading && profile && !isHost) {
      router.replace("/");
    }
  }, [loading, profile, isHost, router]);

  if (loading || !profile || !isHost) return null;

  return (
    <Container className="py-8 sm:py-10">
      <HostMobileNav />

      <div className="mt-6 grid grid-cols-1 gap-8 lg:mt-0 lg:grid-cols-[240px_1fr]">
        <aside className="hidden lg:block">
          <div className="mb-6 flex items-center gap-3">
            <Image
              src={host.avatarUrl}
              alt={host.name}
              width={40}
              height={40}
              className="size-10 rounded-full object-cover"
            />
            <div>
              <p className="text-xs text-muted-foreground">Host Dashboard</p>
              <p className="font-heading text-sm font-semibold text-foreground">{host.name}</p>
            </div>
          </div>
          <HostSidebarNav />
        </aside>

        <div>{children}</div>
      </div>
    </Container>
  );
}
