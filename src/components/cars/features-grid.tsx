"use client";

import { useState } from "react";
import { CategoryIcon } from "@/components/category-icon";
import { getCarFeature } from "@/data/car-features";

export function FeaturesGrid({ features }: { features: string[] }) {
  const [expanded, setExpanded] = useState(false);
  const resolved = features.map((key) => getCarFeature(key)).filter((f) => f !== undefined);
  const visible = expanded ? resolved : resolved.slice(0, 8);

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {visible.map((feature) => (
          <div key={feature.key} className="flex items-center gap-2.5 text-sm text-foreground">
            <CategoryIcon name={feature.icon} className="size-4 text-muted-foreground" />
            {feature.label}
          </div>
        ))}
      </div>
      {resolved.length > 8 && (
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="mt-4 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:border-primary"
        >
          {expanded ? "Show less" : `Show all ${resolved.length} features`}
        </button>
      )}
    </div>
  );
}
