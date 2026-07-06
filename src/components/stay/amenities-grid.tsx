"use client";

import { useState } from "react";
import { CategoryIcon } from "@/components/category-icon";
import { getAmenity } from "@/data/amenities";

export function AmenitiesGrid({ amenities }: { amenities: string[] }) {
  const [expanded, setExpanded] = useState(false);
  const resolved = amenities.map((key) => getAmenity(key)).filter((a) => a !== undefined);
  const visible = expanded ? resolved : resolved.slice(0, 8);

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {visible.map((amenity) => (
          <div key={amenity.key} className="flex items-center gap-2.5 text-sm text-foreground">
            <CategoryIcon name={amenity.icon} className="size-4 text-muted-foreground" />
            {amenity.label}
          </div>
        ))}
      </div>
      {resolved.length > 8 && (
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="mt-4 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:border-primary"
        >
          {expanded ? "Show less" : `Show all ${resolved.length} amenities`}
        </button>
      )}
    </div>
  );
}
