"use client";

import { motion } from "framer-motion";
import { Container } from "@/components/container";
import { ServiceTabsBar } from "@/components/service-tabs-bar";
import { SearchWidget } from "@/components/home/search-widget";
import type { ServiceTabId } from "@/lib/service-tabs";

export function VerticalHero({
  activeTab,
  headline,
  subheading,
  showSearch = true,
}: {
  activeTab: ServiceTabId;
  headline: string;
  subheading?: string;
  showSearch?: boolean;
}) {
  return (
    <section className="bg-gradient-to-br from-[var(--brand-primary-gradient-from)] via-[var(--brand-primary-gradient-via)] to-[var(--brand-primary-gradient-to)] text-white">
      <Container className="max-w-[64rem] overflow-x-auto pt-4 lg:px-6">
        <ServiceTabsBar activeId={activeTab} />
      </Container>

      <div className="mx-auto flex w-full max-w-[64rem] flex-col items-start px-4 pt-16 pb-16 text-left sm:px-6 sm:pt-20 sm:pb-24">
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="font-heading text-3xl leading-tight font-extrabold text-balance sm:text-4xl lg:text-5xl"
        >
          {headline}
        </motion.h1>
        {subheading && (
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
            className="mt-4 max-w-[700px] text-balance text-base text-white/85 sm:text-lg"
          >
            {subheading}
          </motion.p>
        )}
      </div>

      {showSearch && (
        <div className="relative mx-auto -mt-8 w-full max-w-[64rem] px-4 pb-10 sm:-mt-10 sm:px-6 sm:pb-14">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
          >
            <SearchWidget activeTab={activeTab} />
          </motion.div>
        </div>
      )}
    </section>
  );
}
