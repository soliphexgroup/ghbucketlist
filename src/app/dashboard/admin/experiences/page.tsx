"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Pause, Play, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAdminListings, setListingActive, removeListing } from "@/lib/db-admin-listings";
import { formatGHS } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ListingKind } from "@/lib/db-availability";

const detailBase: Record<ListingKind, string> = {
  stay: "/stay",
  car: "/cars",
  experience: "/activities",
  service: "/services",
};

export default function AdminExperiencesPage() {
  const { listings, refresh } = useAdminListings();
  const [kindFilter, setKindFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const rows = useMemo(() => {
    return listings
      .filter((l) => (kindFilter === "all" ? true : l.kind === kindFilter))
      .filter((l) =>
        statusFilter === "all" ? true : statusFilter === "active" ? l.isActive : !l.isActive
      );
  }, [listings, kindFilter, statusFilter]);

  async function togglePause(id: string, active: boolean) {
    setBusy(id);
    setError(null);
    const res = await setListingActive(id, active);
    setBusy(null);
    if (!res.ok) return setError(res.message);
    refresh();
  }

  async function remove(id: string) {
    setBusy(id);
    setError(null);
    const res = await removeListing(id);
    setBusy(null);
    if (!res.ok) return setError(res.message);
    refresh();
  }

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-foreground">Listings</h1>
      <p className="mt-1 text-muted-foreground">
        Every listing on GHBucketlist. Pause hides it from the public marketplace; remove deletes it.
      </p>

      {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

      <div className="mt-6 flex flex-wrap gap-3">
        <Select value={kindFilter} onValueChange={setKindFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="stay">Stays</SelectItem>
            <SelectItem value="car">Cars</SelectItem>
            <SelectItem value="experience">Experiences</SelectItem>
            <SelectItem value="service">Services</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="paused">Paused</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <p className="mt-4 text-sm text-muted-foreground">
        Showing {rows.length} listing{rows.length === 1 ? "" : "s"}
      </p>

      <div className="mt-2 overflow-x-auto rounded-2xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-secondary/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Listing</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">City</th>
              <th className="px-4 py-3 font-medium">Price from</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((l) => (
              <tr key={l.id} className="border-t border-border">
                <td className="flex items-center gap-2 px-4 py-3 text-foreground">
                  {l.image && (
                    <Image src={l.image} alt={l.title} width={40} height={40} className="size-10 rounded-lg object-cover" />
                  )}
                  <Link href={`${detailBase[l.kind]}/${l.slug}`} className="hover:text-primary">
                    {l.title}
                  </Link>
                </td>
                <td className="px-4 py-3 capitalize text-muted-foreground">{l.kind}</td>
                <td className="px-4 py-3 text-muted-foreground">{l.city ?? "—"}</td>
                <td className="px-4 py-3 text-foreground">{formatGHS(l.priceFrom)}</td>
                <td className="px-4 py-3">
                  <Badge
                    className={cn(l.isActive ? "bg-success/10 text-success" : "")}
                    variant={l.isActive ? "default" : "outline"}
                  >
                    {l.isActive ? "Active" : "Paused"}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => togglePause(l.id, !l.isActive)}
                      disabled={busy === l.id}
                      className="text-muted-foreground hover:text-foreground disabled:opacity-40"
                      aria-label={l.isActive ? "Pause listing" : "Activate listing"}
                    >
                      {l.isActive ? <Pause className="size-4" /> : <Play className="size-4" />}
                    </button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <button className="text-destructive hover:text-destructive/80 disabled:opacity-40" disabled={busy === l.id} aria-label="Remove listing">
                          <Trash2 className="size-4" />
                        </button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remove {l.title}?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This permanently deletes the listing from the database. This can&apos;t be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => remove(l.id)}>Remove</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                  No listings match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
