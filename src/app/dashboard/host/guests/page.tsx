"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useHostLedger } from "@/lib/host-repository";
import { formatGHS } from "@/lib/format";

export default function GuestsPage() {
  const ledger = useHostLedger();
  const [query, setQuery] = useState("");
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  // A guest may book both experiences and stays; group across the whole ledger by
  // email (falling back to name for a guest's own live booking, which carries no email).
  const guestKey = (e: { guestEmail: string; guestName: string }) => e.guestEmail || e.guestName;

  const guests = useMemo(() => {
    const map = new Map<
      string,
      { key: string; name: string; email: string; avatar: string; totalBookings: number; totalSpent: number; lastVisit: string }
    >();

    for (const e of ledger) {
      if (e.status === "cancelled") continue;
      const key = guestKey(e);
      const existing = map.get(key);
      if (existing) {
        existing.totalBookings += 1;
        existing.totalSpent += e.gross;
        if (new Date(e.dateISO) > new Date(existing.lastVisit)) existing.lastVisit = e.dateISO;
      } else {
        map.set(key, {
          key,
          name: e.guestName,
          email: e.guestEmail,
          avatar: e.guestAvatar,
          totalBookings: 1,
          totalSpent: e.gross,
          lastVisit: e.dateISO,
        });
      }
    }

    return Array.from(map.values())
      .filter(
        (g) =>
          !query.trim() ||
          g.name.toLowerCase().includes(query.trim().toLowerCase()) ||
          g.email.toLowerCase().includes(query.trim().toLowerCase())
      )
      .sort((a, b) => b.totalSpent - a.totalSpent);
  }, [ledger, query]);

  const selectedGuestBookings = ledger.filter(
    (e) => guestKey(e) === selectedKey && e.status !== "cancelled"
  );

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-foreground">Guests</h1>
      <p className="mt-1 text-muted-foreground">Everyone who&apos;s booked one of your listings.</p>

      <div className="relative mt-6 max-w-sm">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or email…"
          className="pl-9"
        />
      </div>

      <div className="mt-4 overflow-x-auto rounded-2xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-secondary/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Guest</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Bookings</th>
              <th className="px-4 py-3 font-medium">Total spent</th>
              <th className="px-4 py-3 font-medium">Last visit</th>
            </tr>
          </thead>
          <tbody>
            {guests.map((g) => (
              <tr
                key={g.key}
                onClick={() => setSelectedKey(g.key)}
                className="cursor-pointer border-t border-border hover:bg-secondary/30"
              >
                <td className="flex items-center gap-2 px-4 py-3 text-foreground">
                  <Image src={g.avatar} alt={g.name} width={28} height={28} className="size-7 rounded-full object-cover" />
                  {g.name}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{g.email || "—"}</td>
                <td className="px-4 py-3 text-muted-foreground">{g.totalBookings}</td>
                <td className="px-4 py-3 text-foreground">{formatGHS(g.totalSpent)}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {new Date(g.lastVisit).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                </td>
              </tr>
            ))}
            {guests.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                  No guests found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={!!selectedKey} onOpenChange={(open) => !open && setSelectedKey(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{guests.find((g) => g.key === selectedKey)?.name}&apos;s history</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            {selectedGuestBookings.map((e) => (
              <div key={e.id} className="rounded-lg border border-border p-3 text-sm">
                <p className="flex items-center gap-2 font-medium text-foreground">
                  {e.listingTitle}
                  <span className="rounded-full bg-secondary px-1.5 py-0.5 text-[10px] font-medium capitalize text-secondary-foreground">
                    {e.kind}
                  </span>
                </p>
                <p className="text-muted-foreground">
                  {new Date(e.dateISO).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}{" "}
                  · {e.detail}
                </p>
                <p className="mt-1 font-medium text-foreground">{formatGHS(e.gross)}</p>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
