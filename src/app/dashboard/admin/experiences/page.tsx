"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Check, Pause, Play, Trash2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { experiences } from "@/data/experiences";
import { categories } from "@/data/categories";
import { pendingListings as initialPending, type PendingListing } from "@/data/pending-listings";
import { getExperienceCategory, getExperienceHost } from "@/lib/repository";
import { formatGHS } from "@/lib/format";
import { cn } from "@/lib/utils";

export default function AdminExperiencesPage() {
  const [pending, setPending] = useState(initialPending);
  const [approved, setApproved] = useState<PendingListing[]>([]);
  const [pausedIds, setPausedIds] = useState<Set<string>>(new Set());
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const rows = useMemo(() => {
    return experiences
      .filter((e) => !deletedIds.has(e.id))
      .map((e) => ({
        id: e.id,
        title: e.title,
        image: e.images[0],
        category: getExperienceCategory(e)?.name ?? "",
        hostName: getExperienceHost(e)?.name ?? "",
        price: Math.min(...e.ticketTypes.map((t) => t.priceGHS)),
        rating: e.rating,
        reviewCount: e.reviewCount,
        status: pausedIds.has(e.id) ? "Paused" : "Active",
      }))
      .filter((r) => (categoryFilter === "all" ? true : r.category === categoryFilter))
      .filter((r) => (statusFilter === "all" ? true : r.status === statusFilter));
  }, [pausedIds, deletedIds, categoryFilter, statusFilter]);

  function togglePause(id: string) {
    setPausedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function approve(listing: PendingListing) {
    setPending((prev) => prev.filter((p) => p.id !== listing.id));
    setApproved((prev) => [...prev, listing]);
  }

  function reject(id: string) {
    setPending((prev) => prev.filter((p) => p.id !== id));
  }

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-foreground">Experiences / Listings</h1>
      <p className="mt-1 text-muted-foreground">Review, approve, and manage every listing on GH Bucketlist.</p>

      <Tabs defaultValue="pending" className="mt-6">
        <TabsList>
          <TabsTrigger value="pending">Pending Submissions ({pending.length})</TabsTrigger>
          <TabsTrigger value="live">Live Listings ({rows.length + approved.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-4 flex flex-col gap-3">
          {pending.length === 0 ? (
            <p className="text-sm text-muted-foreground">No submissions waiting for review.</p>
          ) : (
            pending.map((listing) => (
              <div key={listing.id} className="flex flex-col gap-3 rounded-2xl border border-border p-4 sm:flex-row sm:items-center">
                <div className="flex-1">
                  <p className="font-heading font-semibold text-foreground">{listing.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {listing.hostName} · {listing.category} · {formatGHS(listing.priceGHS)}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">{listing.description}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Submitted {new Date(listing.submittedDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => reject(listing.id)}>
                    <X className="size-3.5" />
                    Reject
                  </Button>
                  <Button size="sm" onClick={() => approve(listing)}>
                    <Check className="size-3.5" />
                    Approve
                  </Button>
                </div>
              </div>
            ))
          )}
        </TabsContent>

        <TabsContent value="live" className="mt-4">
          <div className="flex flex-wrap gap-3">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.name}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Paused">Paused</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {approved.length > 0 && (
            <div className="mt-4 flex flex-col gap-2">
              {approved.map((listing) => (
                <div key={listing.id} className="flex items-center justify-between rounded-xl border border-success/30 bg-success/5 p-3 text-sm">
                  <span className="text-foreground">
                    {listing.title} <span className="text-muted-foreground">— newly approved, awaiting host publish</span>
                  </span>
                  <Badge className="bg-success/10 text-success">Approved</Badge>
                </div>
              ))}
            </div>
          )}

          <div className="mt-4 overflow-x-auto rounded-2xl border border-border">
            <table className="w-full text-sm">
              <thead className="bg-secondary/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Listing</th>
                  <th className="px-4 py-3 font-medium">Host</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Price</th>
                  <th className="px-4 py-3 font-medium">Rating</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t border-border">
                    <td className="flex items-center gap-2 px-4 py-3 text-foreground">
                      <Image src={r.image} alt={r.title} width={40} height={40} className="size-10 rounded-lg object-cover" />
                      <Link href={`/activities/${experiences.find((e) => e.id === r.id)?.slug}`} className="hover:text-primary">
                        {r.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{r.hostName}</td>
                    <td className="px-4 py-3 text-muted-foreground">{r.category}</td>
                    <td className="px-4 py-3 text-foreground">{formatGHS(r.price)}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {r.rating.toFixed(1)} ({r.reviewCount})
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={cn(r.status === "Active" ? "bg-success/10 text-success" : "")} variant={r.status === "Active" ? "default" : "outline"}>
                        {r.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => togglePause(r.id)} className="text-muted-foreground hover:text-foreground" aria-label="Toggle status">
                          {r.status === "Active" ? <Pause className="size-4" /> : <Play className="size-4" />}
                        </button>
                        <button
                          onClick={() => setDeletedIds((prev) => new Set(prev).add(r.id))}
                          className="text-destructive hover:text-destructive/80"
                          aria-label="Delete"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
