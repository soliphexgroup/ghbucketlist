"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { AdminSidebarNav } from "@/components/dashboard/admin-sidebar";

export function AdminMobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex items-center justify-between border-b border-border pb-4 lg:hidden">
      <p className="font-heading text-lg font-semibold text-foreground">Admin Panel</p>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <button
            type="button"
            aria-label="Open admin menu"
            className="flex size-9 items-center justify-center rounded-full border border-border text-foreground"
          >
            <Menu className="size-4" />
          </button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Admin Panel</SheetTitle>
          </SheetHeader>
          <div className="px-4 pb-6">
            <AdminSidebarNav onNavigate={() => setOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
