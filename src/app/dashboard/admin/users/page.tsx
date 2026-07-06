"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { platformUsers, type PlatformUser } from "@/data/platform-users";
import { useAllPlatformBookings } from "@/lib/admin-repository";
import { experiences } from "@/data/experiences";
import { formatGHS } from "@/lib/format";
import { cn } from "@/lib/utils";

export default function AdminUsersPage() {
  const bookings = useAllPlatformBookings();
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusOverrides, setStatusOverrides] = useState<Record<string, PlatformUser["status"]>>({});
  const [selected, setSelected] = useState<PlatformUser | null>(null);

  const users = useMemo(() => {
    return platformUsers
      .map((u) => ({ ...u, status: statusOverrides[u.id] ?? u.status }))
      .filter((u) => (roleFilter === "all" ? true : u.role === roleFilter))
      .filter(
        (u) =>
          !query.trim() ||
          u.name.toLowerCase().includes(query.trim().toLowerCase()) ||
          u.email.toLowerCase().includes(query.trim().toLowerCase())
      );
  }, [roleFilter, query, statusOverrides]);

  function toggleStatus(id: string, current: PlatformUser["status"]) {
    setStatusOverrides((prev) => ({ ...prev, [id]: current === "active" ? "suspended" : "active" }));
  }

  const selectedBookings = selected ? bookings.filter((b) => b.guestEmail === selected.email) : [];

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-foreground">Users</h1>
      <p className="mt-1 text-muted-foreground">Manage every account on the platform.</p>

      <div className="mt-6 flex flex-wrap gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name or email…" className="pl-9" />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All roles</SelectItem>
            <SelectItem value="customer">Customer</SelectItem>
            <SelectItem value="host">Host</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="mt-4 overflow-x-auto rounded-2xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-secondary/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">User</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Joined</th>
              <th className="px-4 py-3 font-medium">Bookings</th>
              <th className="px-4 py-3 font-medium">Spent</th>
              <th className="px-4 py-3 font-medium">GP</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-border">
                <td className="flex items-center gap-2 px-4 py-3 text-foreground">
                  <Image src={u.avatarUrl} alt={u.name} width={28} height={28} className="size-7 rounded-full object-cover" />
                  <div>
                    <p>{u.name}</p>
                    <p className="text-xs text-muted-foreground">{u.email}</p>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground capitalize">{u.role}</td>
                <td className="px-4 py-3">
                  <Badge className={cn("capitalize", u.status === "active" ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive")}>
                    {u.status}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {new Date(u.joinDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{u.totalBookings}</td>
                <td className="px-4 py-3 text-foreground">{formatGHS(u.totalSpent)}</td>
                <td className="px-4 py-3 text-muted-foreground">{u.gpBalance}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-3">
                    <button onClick={() => setSelected(u)} className="text-xs font-medium text-primary hover:underline">
                      View
                    </button>
                    <button
                      onClick={() => toggleStatus(u.id, u.status)}
                      className={cn(
                        "text-xs font-medium hover:underline",
                        u.status === "active" ? "text-destructive" : "text-success"
                      )}
                    >
                      {u.status === "active" ? "Suspend" : "Activate"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{selected?.name}</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <Image src={selected.avatarUrl} alt={selected.name} width={48} height={48} className="size-12 rounded-full object-cover" />
                <div>
                  <p className="font-medium text-foreground">{selected.email}</p>
                  <p className="text-sm text-muted-foreground capitalize">{selected.role} · {selected.status}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-sm">
                <div className="rounded-lg bg-secondary/50 p-2">
                  <p className="font-heading font-semibold text-foreground">{selected.totalBookings}</p>
                  <p className="text-xs text-muted-foreground">Bookings</p>
                </div>
                <div className="rounded-lg bg-secondary/50 p-2">
                  <p className="font-heading font-semibold text-foreground">{formatGHS(selected.totalSpent)}</p>
                  <p className="text-xs text-muted-foreground">Spent</p>
                </div>
                <div className="rounded-lg bg-secondary/50 p-2">
                  <p className="font-heading font-semibold text-foreground">{selected.gpBalance}</p>
                  <p className="text-xs text-muted-foreground">GP</p>
                </div>
              </div>
              {selectedBookings.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-foreground">Recent bookings</p>
                  <div className="mt-2 flex flex-col gap-1.5">
                    {selectedBookings.slice(0, 5).map((b) => {
                      const exp = experiences.find((e) => e.id === b.experienceId);
                      return (
                        <div key={b.id} className="flex justify-between text-sm text-muted-foreground">
                          <span>{exp?.title}</span>
                          <span>{formatGHS(b.total)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              <Button variant="outline" onClick={() => setSelected(null)}>
                Close
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
