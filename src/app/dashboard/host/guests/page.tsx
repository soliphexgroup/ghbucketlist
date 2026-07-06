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
import { useHostBookings } from "@/lib/host-repository";
import { getExperienceById } from "@/data/experiences";
import { formatGHS } from "@/lib/format";

export default function GuestsPage() {
  const bookings = useHostBookings();
  const [query, setQuery] = useState("");
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null);

  const guests = useMemo(() => {
    const map = new Map<
      string,
      { name: string; email: string; avatar: string; totalBookings: number; totalSpent: number; lastVisit: string }
    >();

    for (const b of bookings) {
      if (b.status === "cancelled") continue;
      const existing = map.get(b.guestEmail);
      if (existing) {
        existing.totalBookings += 1;
        existing.totalSpent += b.total;
        if (new Date(b.dateISO) > new Date(existing.lastVisit)) existing.lastVisit = b.dateISO;
      } else {
        map.set(b.guestEmail, {
          name: b.guestName,
          email: b.guestEmail,
          avatar: b.guestAvatar,
          totalBookings: 1,
          totalSpent: b.total,
          lastVisit: b.dateISO,
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
  }, [bookings, query]);

  const selectedGuestBookings = bookings.filter(
    (b) => b.guestEmail === selectedEmail && b.status !== "cancelled"
  );

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-foreground">Guests</h1>
      <p className="mt-1 text-muted-foreground">Everyone who&apos;s booked one of your experiences.</p>

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
                key={g.email}
                onClick={() => setSelectedEmail(g.email)}
                className="cursor-pointer border-t border-border hover:bg-secondary/30"
              >
                <td className="flex items-center gap-2 px-4 py-3 text-foreground">
                  <Image src={g.avatar} alt={g.name} width={28} height={28} className="size-7 rounded-full object-cover" />
                  {g.name}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{g.email}</td>
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

      <Dialog open={!!selectedEmail} onOpenChange={(open) => !open && setSelectedEmail(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{guests.find((g) => g.email === selectedEmail)?.name}&apos;s history</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            {selectedGuestBookings.map((b) => {
              const exp = getExperienceById(b.experienceId);
              return (
                <div key={b.id} className="rounded-lg border border-border p-3 text-sm">
                  <p className="font-medium text-foreground">{exp?.title}</p>
                  <p className="text-muted-foreground">
                    {new Date(b.dateISO).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}{" "}
                    · {b.ticketTypeName} · Qty {b.quantity}
                  </p>
                  <p className="mt-1 font-medium text-foreground">{formatGHS(b.total)}</p>
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
