"use client";

import Image from "next/image";
import Link from "next/link";
import { MapPin, Phone } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { serviceCategoryLabels } from "@/data/service-categories";
import { cancelServiceRequest, type StoredServiceRequest } from "@/lib/service-requests-store";
import { cn } from "@/lib/utils";

const statusStyles: Record<StoredServiceRequest["status"], string> = {
  pending: "bg-brand-coral/10 text-brand-coral",
  accepted: "bg-success/10 text-success",
  declined: "bg-destructive/10 text-destructive",
  cancelled: "bg-destructive/10 text-destructive",
  completed: "bg-secondary text-secondary-foreground",
};

const statusLabels: Record<StoredServiceRequest["status"], string> = {
  pending: "Awaiting provider",
  accepted: "Accepted",
  declined: "Declined",
  cancelled: "Cancelled",
  completed: "Completed",
};

export function ServiceRequestCard({ request }: { request: StoredServiceRequest }) {
  const canCancel = request.status === "pending" || request.status === "accepted";

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border p-4 sm:flex-row">
      <Link href={`/services/${request.providerSlug}`} className="relative size-16 shrink-0 overflow-hidden rounded-full sm:size-20">
        <Image src={request.providerAvatar} alt={request.providerName} fill className="object-cover" />
      </Link>

      <div className="flex flex-1 flex-col gap-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <Link href={`/services/${request.providerSlug}`} className="font-heading text-base font-semibold text-foreground hover:text-primary">
              {request.providerName}
            </Link>
            <p className="text-sm text-muted-foreground capitalize">{serviceCategoryLabels[request.category]}</p>
          </div>
          <Badge className={cn("capitalize", statusStyles[request.status])}>{statusLabels[request.status]}</Badge>
        </div>

        <p className="text-sm text-muted-foreground">{request.jobDescription}</p>

        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
          {request.preferredDate && <span>Preferred: {request.preferredDate}</span>}
          <span className="flex items-center gap-1">
            <MapPin className="size-3.5" />
            {request.address}
          </span>
          <span className="flex items-center gap-1">
            <Phone className="size-3.5" />
            {request.phone}
          </span>
        </div>

        {canCancel && (
          <div className="mt-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                  Cancel
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Cancel this request?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will cancel your service request with {request.providerName}.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Keep request</AlertDialogCancel>
                  <AlertDialogAction onClick={() => cancelServiceRequest(request.reference)}>
                    Yes, cancel
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </div>
    </div>
  );
}
