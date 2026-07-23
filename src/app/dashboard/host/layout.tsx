"use client";

import Image from "next/image";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Eye, X } from "lucide-react";
import { Container } from "@/components/container";
import { HostSidebarNav } from "@/components/dashboard/host-sidebar";
import { HostMobileNav } from "@/components/dashboard/host-mobile-nav";
import { useAuth } from "@/lib/auth-context";
import { useCurrentHost } from "@/lib/host-repository";
import { useDemoHostPreview, setDemoHostPreview } from "@/lib/demo-host-preview";

export default function HostDashboardLayout({ children }: { children: React.ReactNode }) {
  const { profile, loading } = useAuth();
  const router = useRouter();
  const host = useCurrentHost();
  const preview = useDemoHostPreview();
  const isHost = profile?.role === "host" || profile?.role === "admin";

  // ?preview=1 turns on demo-host mode (view the seeded dashboard without signing in).
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (new URLSearchParams(window.location.search).get("preview") === "1") {
      setDemoHostPreview(true);
    }
  }, []);

  // In preview we intentionally skip the auth gate; otherwise real hosts only.
  useEffect(() => {
    if (!preview && !loading && profile && !isHost) {
      router.replace("/");
    }
  }, [preview, loading, profile, isHost, router]);

  if (!preview && (loading || !profile || !isHost)) return null;

  function exitPreview() {
    setDemoHostPreview(false);
    router.push("/");
  }

  return (
    <Container className="py-8 sm:py-10">
      {preview && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand-gold/40 bg-brand-gold/10 px-4 py-3">
          <p className="flex items-center gap-2 text-sm text-foreground">
            <Eye className="size-4 text-brand-gold" />
            <span>
              <span className="font-semibold">Demo preview</span> — viewing the host dashboard as{" "}
              {host.name} with sample data. Nothing here is live.
            </span>
          </p>
          <button
            type="button"
            onClick={exitPreview}
            className="flex items-center gap-1 text-sm font-medium text-foreground hover:underline"
          >
            <X className="size-4" />
            Exit preview
          </button>
        </div>
      )}

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
