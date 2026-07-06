"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { HostSidebarNav } from "@/components/dashboard/host-sidebar";

export function HostMobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex items-center justify-between border-b border-border pb-4 lg:hidden">
      <p className="font-heading text-lg font-semibold text-foreground">Host Dashboard</p>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <button
            type="button"
            aria-label="Open host menu"
            className="flex size-9 items-center justify-center rounded-full border border-border text-foreground"
          >
            <Menu className="size-4" />
          </button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72">
          <SheetHeader>
            <SheetTitle>Host Dashboard</SheetTitle>
          </SheetHeader>
          <div className="px-4 pb-6">
            <HostSidebarNav onNavigate={() => setOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
