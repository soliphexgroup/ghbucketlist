"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { BedDouble, Heart, MapPin, Search, Utensils, Wrench, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { MobileStaySearch } from "@/components/home/mobile-stay-search";
import type { ServiceTabId } from "@/lib/service-tabs";

type Shortcut = {
  id: ServiceTabId;
  label: string;
  icon: LucideIcon;
  href: string;
  badge?: { text: string; tone: "popular" | "new" };
};

const shortcuts: Shortcut[] = [
  { id: "stays", label: "Stays", icon: BedDouble, href: "/stay", badge: { text: "Popular", tone: "popular" } },
  { id: "things-to-do", label: "Things to do", icon: Heart, href: "/activities" },
  { id: "car-rentals", label: "Car Rentals", icon: MapPin, href: "/cars" },
  { id: "handyman", label: "Handyman Services", icon: Wrench, href: "/services" },
  { id: "restaurants", label: "Restaurants Guide", icon: Utensils, href: "/restaurants", badge: { text: "New", tone: "new" } },
];

export function MobileHero({
  activeTab,
  headline,
  subheading,
}: {
  activeTab: ServiceTabId;
  headline: string;
  subheading: string;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  // The active category's listing is where the search pill sends people.
  const searchBase = shortcuts.find((s) => s.id === activeTab)?.href ?? "/stay";

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    router.push(`${searchBase}${q ? `?q=${encodeURIComponent(q)}` : ""}`);
  }

  return (
    <section className="relative overflow-hidden lg:hidden">
      {/* Tropical backdrop under a green brand tint */}
      <div className="absolute inset-0">
        <Image
          src="/images/hero/beach-bar-sunset.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--brand-primary-gradient-from)]/95 via-[var(--brand-primary-gradient-via)]/90 to-[var(--brand-primary-gradient-to)]/85" />
      </div>

      <div className="relative px-5 pt-10 pb-9 text-white">
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="font-heading text-[2.75rem] leading-[1.05] font-extrabold tracking-tight text-balance"
        >
          {headline}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
          className="mt-4 max-w-[22rem] text-lg leading-snug text-white/90"
        >
          {subheading}
        </motion.p>

        {/* Stays gets the full stacked search box; the other verticals keep the simple pill. */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
          className="mt-8"
        >
          {activeTab === "stays" ? (
            <MobileStaySearch />
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="flex items-center gap-3 rounded-2xl bg-white px-5 py-4 shadow-2xl">
                <Search className="size-5 shrink-0 text-muted-foreground" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Where do you want to explore?"
                  aria-label="Where do you want to explore?"
                  className="min-w-0 flex-1 border-0 bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground"
                />
                <div className="h-6 w-px shrink-0 bg-border" />
                <button
                  type="submit"
                  aria-label="Search"
                  className="shrink-0 text-foreground transition-opacity hover:opacity-70"
                >
                  <Search className="size-5" />
                </button>
              </div>
            </form>
          )}
        </motion.div>

        {/* Category shortcuts */}
        <motion.nav
          aria-label="Browse categories"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
          className="mt-8 grid grid-cols-5 gap-1.5"
        >
          {shortcuts.map((s) => {
            const Icon = s.icon;
            const isActive = s.id === activeTab;
            return (
              <Link
                key={s.id}
                href={s.href}
                aria-current={isActive ? "page" : undefined}
                className="group flex flex-col items-center gap-2 rounded-xl px-0.5 py-1 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
              >
                <div className="relative">
                  <div
                    className={cn(
                      "flex size-14 items-center justify-center rounded-full transition-colors duration-200",
                      isActive
                        ? "bg-white/15 ring-2 ring-[var(--brand-coral)]"
                        : "bg-white/10 group-hover:bg-white/20"
                    )}
                  >
                    <Icon className="size-6 text-white" />
                  </div>
                  {s.badge && (
                    <span
                      className={cn(
                        "absolute -bottom-1.5 left-1/2 -translate-x-1/2 rounded-full px-2 py-0.5 text-[10px] font-semibold leading-none shadow-sm",
                        s.badge.tone === "popular"
                          ? "bg-[var(--brand-coral)] text-white"
                          : "bg-emerald-300 text-emerald-950"
                      )}
                    >
                      {s.badge.text}
                    </span>
                  )}
                </div>
                <span className="text-[11px] font-medium leading-tight text-white">{s.label}</span>
              </Link>
            );
          })}
        </motion.nav>
      </div>
    </section>
  );
}
