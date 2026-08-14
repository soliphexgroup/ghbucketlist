import Link from "next/link";
import { Loader2 } from "lucide-react";

// Shown by the host "new/edit" forms while an existing listing is still loading, so the form mounts
// pre-filled instead of flashing blank. Small and layout-neutral (the forms render their own shell).

export function EditListingLoading() {
  return (
    <div className="flex flex-col items-center gap-3 py-24 text-center text-muted-foreground">
      <Loader2 className="size-6 animate-spin" />
      <p className="text-sm">Loading your listing…</p>
    </div>
  );
}

export function EditListingNotFound({ backHref }: { backHref: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-24 text-center">
      <p className="font-heading text-lg font-semibold text-foreground">Listing not found</p>
      <p className="max-w-sm text-sm text-muted-foreground">
        It may have been removed. Go back and pick it from your list to edit.
      </p>
      <Link href={backHref} className="mt-1 text-sm font-medium text-primary hover:underline">
        Back to your listings
      </Link>
    </div>
  );
}
