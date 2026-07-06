"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronDown, Menu, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Container } from "@/components/container";
import { cn } from "@/lib/utils";

const exploreLinks = [
  { label: "Things To Do", href: "/activities", available: true },
  { label: "Date Experiences", href: "/activities?category=arts-culture", available: true },
  { label: "Places To Stay", href: "/stay", available: true },
  { label: "Car Rental", href: "/cars", available: true },
  { label: "Handyman Services", href: "/services", available: true },
];

const navLinks = [
  { label: "Become a Host", href: "/hosting" },
  { label: "Curated Trips", href: "/trips" },
  { label: "Blog", href: "/blog" },
];

export function SiteHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm">
      <Container className="flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="font-heading text-2xl font-bold tracking-tight text-primary">
            GH Bucketlist
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-1 rounded-full px-3 py-2 text-sm font-medium text-foreground transition-colors duration-200 hover:bg-accent hover:text-accent-foreground"
              >
                Explore
                <ChevronDown className="size-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              {exploreLinks.map((link) =>
                link.available ? (
                  <DropdownMenuItem key={link.href} asChild>
                    <Link href={link.href}>{link.label}</Link>
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem key={link.href} asChild>
                    <Link href={link.href} className="flex items-center justify-between text-muted-foreground">
                      {link.label}
                      <span className="text-xs">Soon</span>
                    </Link>
                  </DropdownMenuItem>
                )
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full px-3 py-2 text-sm font-medium text-foreground transition-colors duration-200 hover:bg-accent hover:text-accent-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Demo dashboards">
                <User className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem asChild>
                <Link href="/dashboard/user">Customer Dashboard</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/host">Host Dashboard</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/admin">Admin Panel</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="ghost" asChild>
            <Link href="/login">Log in</Link>
          </Button>
          <Button asChild>
            <Link href="/signup">Sign up</Link>
          </Button>
        </div>

        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <button
              type="button"
              aria-label="Open menu"
              className="flex size-10 items-center justify-center rounded-full text-foreground lg:hidden"
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
              {exploreLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium",
                    link.available ? "text-foreground hover:bg-accent" : "text-muted-foreground"
                  )}
                >
                  {link.label}
                  {!link.available && <span className="text-xs">Soon</span>}
                </Link>
              ))}
              <div className="my-2 h-px bg-border" />
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-accent"
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/dashboard/user"
                onClick={() => setMobileOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-accent"
              >
                Customer Dashboard
              </Link>
              <Link
                href="/dashboard/host"
                onClick={() => setMobileOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-accent"
              >
                Host Dashboard
              </Link>
              <Link
                href="/dashboard/admin"
                onClick={() => setMobileOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-accent"
              >
                Admin Panel
              </Link>
              <div className="my-2 h-px bg-border" />
              <div className="flex flex-col gap-2 px-1 pt-2">
                <Button variant="outline" asChild>
                  <Link href="/login" onClick={() => setMobileOpen(false)}>
                    Log in
                  </Link>
                </Button>
                <Button asChild>
                  <Link href="/signup" onClick={() => setMobileOpen(false)}>
                    Sign up
                  </Link>
                </Button>
              </div>
            </nav>
          </SheetContent>
        </Sheet>
      </Container>
    </header>
  );
}
