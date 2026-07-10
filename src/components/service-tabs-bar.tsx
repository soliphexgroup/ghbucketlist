"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { serviceTabs, type ServiceTabId } from "@/lib/service-tabs";
import { cn } from "@/lib/utils";

export function ServiceTabsBar({ activeId }: { activeId: ServiceTabId | null }) {
  return (
    <nav className="flex flex-wrap items-center gap-1.5" aria-label="Browse by service">
      {serviceTabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = tab.id === activeId;

        return (
          <Link
            key={tab.id}
            href={tab.href}
            className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
          >
            <motion.span
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.97 }}
              className={cn(
                "flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors duration-200",
                isActive
                  ? "border-white/80 bg-white/10 text-white"
                  : "border-transparent text-white/85 hover:border-white/40 hover:text-white"
              )}
            >
              <Icon className="size-4" />
              {tab.label}
            </motion.span>
          </Link>
        );
      })}
    </nav>
  );
}
