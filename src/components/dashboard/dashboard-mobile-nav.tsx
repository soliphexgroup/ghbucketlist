"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { UserSidebarNav } from "@/components/dashboard/user-sidebar";

export function DashboardMobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex items-center justify-between border-b border-border pb-4 lg:hidden">
      <p className="font-heading text-lg font-semibold text-foreground">My Account</p>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <button
            type="button"
            aria-label="Open account menu"
            className="flex size-9 items-center justify-center rounded-full border border-border text-foreground"
          >
            <Menu className="size-4" />
          </button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72">
          <SheetHeader>
            <SheetTitle>My Account</SheetTitle>
          </SheetHeader>
          <div className="px-4 pb-6">
            <UserSidebarNav onNavigate={() => setOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
