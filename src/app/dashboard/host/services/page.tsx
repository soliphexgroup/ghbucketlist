"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, Copy, Pause, Play, Pencil, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { StarRating } from "@/components/star-rating";
import { useCurrentHostId } from "@/lib/host-repository";
import { useHostDbServiceListings, deleteListing } from "@/lib/db-listings";
import { serviceCategoryLabels } from "@/data/service-categories";
import { formatGHS } from "@/lib/format";

export default function MyServicesPage() {
  const { items: services } = useHostDbServiceListings(useCurrentHostId());
  const [pausedIds, setPausedIds] = useState<Set<string>>(new Set());
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());

  function togglePause(id: string) {
    setPausedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const visible = services.filter((s) => !deletedIds.has(s.id));

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">My Services</h1>
          <p className="mt-1 text-muted-foreground">
            Manage the handyman services you offer and their status.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/host/services/new">
            <Plus className="size-4" />
            Add New Service
          </Link>
        </Button>
      </div>

      <div className="mt-6 flex flex-col gap-4">
        {visible.map((provider) => {
          const isPaused = pausedIds.has(provider.id);
          const thumb = provider.portfolioImages[0] ?? provider.avatarUrl;

          return (
            <div
              key={provider.id}
              className="flex flex-col gap-4 rounded-2xl border border-border p-4 sm:flex-row sm:items-center"
            >
              <div className="relative h-28 w-full shrink-0 overflow-hidden rounded-xl sm:h-20 sm:w-28">
                <Image src={thumb} alt={provider.name} fill className="object-cover" />
              </div>

              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/services/${provider.slug}`}
                    className="font-heading font-semibold text-foreground hover:text-primary"
                  >
                    {provider.name}
                  </Link>
                  <Badge variant="outline">{serviceCategoryLabels[provider.category]}</Badge>
                  <Badge variant={isPaused ? "outline" : "default"}>
                    {isPaused ? "Paused" : "Active"}
                  </Badge>
                  {provider.verified ? (
                    <Badge variant="outline" className="gap-1 text-primary">
                      <BadgeCheck className="size-3.5" />
                      Verified
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground">
                      Pending verification
                    </Badge>
                  )}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  <span>{formatGHS(provider.hourlyRate)} / hr</span>
                  <span>
                    {provider.serviceArea} · {provider.city}
                  </span>
                  <StarRating rating={provider.rating} reviewCount={provider.reviewCount} />
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/dashboard/host/services/new?edit=${provider.id}`}>
                    <Pencil className="size-3.5" />
                    Edit
                  </Link>
                </Button>
                <Button variant="outline" size="sm" onClick={() => togglePause(provider.id)}>
                  {isPaused ? <Play className="size-3.5" /> : <Pause className="size-3.5" />}
                  {isPaused ? "Activate" : "Pause"}
                </Button>
                <Button variant="outline" size="sm">
                  <Copy className="size-3.5" />
                  Duplicate
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                      <Trash2 className="size-3.5" />
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete {provider.name}?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This removes the listing from your dashboard view for this demo session.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => {
                          setDeletedIds((prev) => new Set(prev).add(provider.id));
                          void deleteListing(provider.id);
                        }}
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          );
        })}

        {visible.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center">
            <p className="text-sm text-muted-foreground">You don&apos;t offer any services yet.</p>
            <Button asChild className="mt-4">
              <Link href="/dashboard/host/services/new">Add your first service</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
