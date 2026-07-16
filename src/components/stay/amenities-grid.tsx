"use client";

import { useState } from "react";
import { CategoryIcon } from "@/components/category-icon";
import { groupAmenities } from "@/data/amenities";

const COLLAPSED_GROUPS = 2;

export function AmenitiesGrid({ amenities }: { amenities: string[] }) {
  const [expanded, setExpanded] = useState(false);
  const groups = groupAmenities(amenities);
  const total = groups.reduce((count, group) => count + group.items.length, 0);
  const visible = expanded ? groups : groups.slice(0, COLLAPSED_GROUPS);

  return (
    <div>
      <div className="flex flex-col gap-6">
        {visible.map((group) => (
          <div key={group.key}>
            <h3 className="font-heading text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {group.label}
            </h3>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {group.items.map((amenity) => (
                <div key={amenity.key} className="flex items-center gap-2.5 text-sm text-foreground">
                  <CategoryIcon name={amenity.icon} className="size-4 shrink-0 text-muted-foreground" />
                  {amenity.label}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {groups.length > COLLAPSED_GROUPS && (
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="mt-6 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:border-primary"
        >
          {expanded ? "Show less" : `Show all ${total} facilities`}
        </button>
      )}
    </div>
  );
}
