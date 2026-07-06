"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Camera, CheckCircle2, Circle, Search } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useHostExperiences, useHostBookings } from "@/lib/host-repository";
import { getExperienceById } from "@/data/experiences";

export default function CheckInPage() {
  const experiences = useHostExperiences();
  const bookings = useHostBookings();
  const [checkedIn, setCheckedIn] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState("");

  const sessions = useMemo(() => {
    const map = new Map<string, { experienceId: string; dateISO: string; scheduleTime: string }>();
    for (const b of bookings) {
      if (b.status === "cancelled") continue;
      const key = `${b.experienceId}__${b.dateISO}`;
      if (!map.has(key)) map.set(key, { experienceId: b.experienceId, dateISO: b.dateISO, scheduleTime: b.scheduleTime });
    }
    return Array.from(map.entries())
      .map(([key, value]) => ({ key, ...value }))
      .sort((a, b) => new Date(b.dateISO).getTime() - new Date(a.dateISO).getTime());
  }, [bookings]);

  const [sessionKey, setSessionKey] = useState(sessions[0]?.key ?? "");
  const activeSession = sessions.find((s) => s.key === sessionKey) ?? sessions[0];

  const sessionBookings = bookings.filter(
    (b) =>
      activeSession &&
      b.experienceId === activeSession.experienceId &&
      b.dateISO === activeSession.dateISO &&
      b.status !== "cancelled"
  );

  const filteredBookings = sessionBookings.filter(
    (b) =>
      !query.trim() ||
      b.guestName.toLowerCase().includes(query.trim().toLowerCase()) ||
      b.id.toLowerCase().includes(query.trim().toLowerCase())
  );

  const totalGuests = sessionBookings.reduce((sum, b) => sum + b.quantity, 0);
  const checkedInGuests = sessionBookings
    .filter((b) => checkedIn.has(b.id) || b.status === "attended")
    .reduce((sum, b) => sum + b.quantity, 0);

  function toggleCheckIn(id: string) {
    setCheckedIn((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const activeExperience = activeSession ? getExperienceById(activeSession.experienceId) : undefined;

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-foreground">QR Check-in</h1>
      <p className="mt-1 text-muted-foreground">Check guests in as they arrive.</p>

      <div className="mt-6 max-w-sm">
        <Select value={sessionKey || sessions[0]?.key} onValueChange={setSessionKey}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a session" />
          </SelectTrigger>
          <SelectContent>
            {sessions.map((s) => {
              const exp = getExperienceById(s.experienceId);
              return (
                <SelectItem key={s.key} value={s.key}>
                  {exp?.title} —{" "}
                  {new Date(s.dateISO).toLocaleDateString("en-GB", { day: "numeric", month: "short" })} ·{" "}
                  {s.scheduleTime}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      {experiences.length === 0 || !activeSession ? (
        <p className="mt-6 text-sm text-muted-foreground">No sessions to check guests into yet.</p>
      ) : (
        <>
          <div className="mt-6 flex items-center gap-4 rounded-2xl border border-border p-5">
            {activeExperience && (
              <Image
                src={activeExperience.images[0]}
                alt={activeExperience.title}
                width={64}
                height={64}
                className="size-16 rounded-xl object-cover"
              />
            )}
            <div>
              <p className="font-heading font-semibold text-foreground">{activeExperience?.title}</p>
              <p className="text-sm text-muted-foreground">
                {new Date(activeSession.dateISO).toLocaleDateString("en-GB", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}{" "}
                · {activeSession.scheduleTime}
              </p>
            </div>
            <div className="ml-auto text-right">
              <p className="font-heading text-2xl font-bold text-foreground">
                {checkedInGuests}/{totalGuests}
              </p>
              <p className="text-xs text-muted-foreground">checked in</p>
            </div>
          </div>

          <Tabs defaultValue="manual" className="mt-6">
            <TabsList>
              <TabsTrigger value="scanner">Scanner</TabsTrigger>
              <TabsTrigger value="manual">Manual</TabsTrigger>
            </TabsList>

            <TabsContent value="scanner" className="mt-4">
              <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border p-10 text-center">
                <Camera className="size-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Camera-based QR scanning requires a live camera and works best on the deployed
                  site — use Manual mode here to search and check in guests.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="manual" className="mt-4">
              <div className="relative max-w-sm">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by name or booking ID…"
                  className="pl-9"
                />
              </div>

              <div className="mt-4 flex flex-col gap-2">
                {filteredBookings.map((b) => {
                  const done = checkedIn.has(b.id) || b.status === "attended";
                  return (
                    <div
                      key={b.id}
                      className="flex items-center gap-3 rounded-xl border border-border p-3"
                    >
                      <Image src={b.guestAvatar} alt={b.guestName} width={36} height={36} className="size-9 rounded-full object-cover" />
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{b.guestName}</p>
                        <p className="text-xs text-muted-foreground">
                          {b.id} · {b.ticketTypeName} · Qty {b.quantity}
                        </p>
                      </div>
                      {done ? (
                        <span className="flex items-center gap-1.5 text-sm font-medium text-success">
                          <CheckCircle2 className="size-4" />
                          Checked in
                        </span>
                      ) : (
                        <Button size="sm" onClick={() => toggleCheckIn(b.id)}>
                          <Circle className="size-3.5" />
                          Check in
                        </Button>
                      )}
                    </div>
                  );
                })}
                {filteredBookings.length === 0 && (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    No guests match your search.
                  </p>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
