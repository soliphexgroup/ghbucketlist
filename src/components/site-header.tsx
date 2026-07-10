"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { HelpCircle, LogOut, Menu, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Container } from "@/components/container";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import type { UserRole } from "@/types/profile";
import { ServiceTabsBar } from "@/components/service-tabs-bar";
import { serviceTabs, getActiveServiceTab, PAGES_WITH_OWN_HERO } from "@/lib/service-tabs";

const secondaryLinks = [
  { label: "Curated Trips", href: "/trips" },
  { label: "Become a Host", href: "/hosting" },
  { label: "Blog", href: "/blog" },
];

const dashboardHrefByRole: Record<UserRole, string> = {
  customer: "/dashboard/user",
  host: "/dashboard/host",
  admin: "/dashboard/admin",
};

function HeaderTabsRow() {
  const pathname = usePathname();

  if (PAGES_WITH_OWN_HERO.includes(pathname)) return null;

  return (
    <div className="hidden border-t border-white/10 lg:block">
      <Container className="flex h-14 max-w-[64rem] items-center lg:px-6">
        <ServiceTabsBar activeId={getActiveServiceTab(pathname)} />
      </Container>
    </div>
  );
}

function MobileTabs({ onNavigate }: { onNavigate: () => void }) {
  const pathname = usePathname();
  const activeId = getActiveServiceTab(pathname);

  return (
    <>
      {serviceTabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = tab.id === activeId;
        return (
          <Link
            key={tab.id}
            href={tab.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium",
              isActive ? "bg-accent text-accent-foreground" : "text-foreground hover:bg-accent"
            )}
          >
            <Icon className="size-4" />
            {tab.label}
          </Link>
        );
      })}
    </>
  );
}

export function SiteHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, profile, loading, signOut } = useAuth();
  const router = useRouter();

  const dashboardHref = profile ? dashboardHrefByRole[profile.role] : "/dashboard/user";
  const hostHref = user ? "/hosting" : "/signup?role=host";

  async function handleSignOut() {
    await signOut();
    setMobileOpen(false);
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-50 bg-gradient-to-br from-[var(--brand-primary-gradient-from)] via-[var(--brand-primary-gradient-via)] to-[var(--brand-primary-gradient-to)] text-white">
      <Container className="flex h-16 max-w-[64rem] items-center justify-between gap-4 lg:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="font-heading text-2xl font-bold tracking-tight text-white">
            GH Bucketlist
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {secondaryLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href === "/hosting" ? hostHref : link.href}
              className="rounded-full px-3 py-2 text-sm font-medium text-white/85 transition-colors duration-200 hover:bg-white/10 hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <button
            type="button"
            aria-label="Help"
            className="flex size-8 items-center justify-center rounded-full text-white/85 transition-colors duration-200 hover:bg-white/10 hover:text-white"
          >
            <HelpCircle className="size-4" />
          </button>

          {loading ? null : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Account menu"
                  className="text-white hover:bg-white/10 hover:text-white"
                >
                  <User className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="truncate">
                  {profile?.full_name || user.email}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href={dashboardHref}>Dashboard</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={handleSignOut} className="text-destructive">
                  <LogOut className="size-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button variant="outline" asChild className="border-white/60 bg-transparent text-white hover:bg-white/10 hover:text-white">
                <Link href="/signup">Register</Link>
              </Button>
              <Button variant="outline" asChild className="border-white/60 bg-transparent text-white hover:bg-white/10 hover:text-white">
                <Link href="/login">Sign in</Link>
              </Button>
            </>
          )}
        </div>

        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <button
              type="button"
              aria-label="Open menu"
              className="flex size-10 items-center justify-center rounded-full text-white lg:hidden"
            >
              <Menu className="size-5" />
            </button>
          </SheetTrigger>
          <SheetContent side="right" className="w-80">
            <SheetHeader>
              <SheetTitle className="font-heading text-xl text-primary">GH Bucketlist</SheetTitle>
            </SheetHeader>
            <nav className="flex flex-col gap-1 px-4">
              <p className="mt-2 mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Explore
              </p>
              <Suspense fallback={null}>
                <MobileTabs onNavigate={() => setMobileOpen(false)} />
              </Suspense>
              <div className="my-2 h-px bg-border" />
              {secondaryLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href === "/hosting" ? hostHref : link.href}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-accent"
                >
                  {link.label}
                </Link>
              ))}
              <div className="my-2 h-px bg-border" />
              {!loading && user ? (
                <>
                  <p className="mb-1 px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {profile?.full_name || user.email}
                  </p>
                  <Link
                    href={dashboardHref}
                    onClick={() => setMobileOpen(false)}
                    className="rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-accent"
                  >
                    Dashboard
                  </Link>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-destructive hover:bg-accent"
                  >
                    <LogOut className="size-4" />
                    Log out
                  </button>
                </>
              ) : (
                <div className="flex flex-col gap-2 px-1 pt-2">
                  <Button variant="outline" asChild>
                    <Link href="/login" onClick={() => setMobileOpen(false)}>
                      Sign in
                    </Link>
                  </Button>
                  <Button asChild>
                    <Link href="/signup" onClick={() => setMobileOpen(false)}>
                      Register
                    </Link>
                  </Button>
                </div>
              )}
            </nav>
          </SheetContent>
        </Sheet>
      </Container>

      <Suspense fallback={null}>
        <HeaderTabsRow />
      </Suspense>
    </header>
  );
}
