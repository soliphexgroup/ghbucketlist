"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAdminUsers, setUserStatus } from "@/lib/db-admin-users";
import { cn } from "@/lib/utils";

export default function AdminUsersPage() {
  const { users, refresh } = useAdminUsers();
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users
      .filter((u) => (roleFilter === "all" ? true : u.role === roleFilter))
      .filter(
        (u) => !q || (u.fullName ?? "").toLowerCase().includes(q) || (u.email ?? "").toLowerCase().includes(q)
      );
  }, [users, roleFilter, query]);

  async function toggleStatus(id: string, current: "active" | "suspended") {
    setBusy(id);
    setError(null);
    const res = await setUserStatus(id, current === "active" ? "suspended" : "active");
    setBusy(null);
    if (!res.ok) return setError(res.message);
    refresh();
  }

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-foreground">Users</h1>
      <p className="mt-1 text-muted-foreground">Manage every account on the platform.</p>

      {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

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
            <SelectItem value="admin">Admin</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <p className="mt-4 text-sm text-muted-foreground">
        Showing {rows.length} user{rows.length === 1 ? "" : "s"}
      </p>

      <div className="mt-2 overflow-x-auto rounded-2xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-secondary/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">User</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Joined</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((u) => (
              <tr key={u.id} className="border-t border-border">
                <td className="px-4 py-3 text-foreground">
                  <p>{u.fullName ?? "—"}</p>
                  <p className="text-xs text-muted-foreground">{u.email ?? "—"}</p>
                </td>
                <td className="px-4 py-3 capitalize text-muted-foreground">{u.role}</td>
                <td className="px-4 py-3">
                  <Badge className={cn("capitalize", u.status === "active" ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive")}>
                    {u.status}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {new Date(u.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                </td>
                <td className="px-4 py-3">
                  {u.role === "admin" ? (
                    <span className="text-xs text-muted-foreground">—</span>
                  ) : (
                    <button
                      onClick={() => toggleStatus(u.id, u.status)}
                      disabled={busy === u.id}
                      className={cn(
                        "text-xs font-medium hover:underline disabled:opacity-40",
                        u.status === "active" ? "text-destructive" : "text-success"
                      )}
                    >
                      {u.status === "active" ? "Suspend" : "Activate"}
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                  No users match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
