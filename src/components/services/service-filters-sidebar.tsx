"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CategoryIcon } from "@/components/category-icon";
import { serviceCategories, serviceCategoryIcons, serviceCategoryLabels } from "@/data/service-categories";
import type { ServiceCategory } from "@/lib/service-types";
import type { ServiceFilterState } from "@/components/services/service-browser";

export function ServiceFiltersSidebar({
  filters,
  onChange,
  onClear,
}: {
  filters: ServiceFilterState;
  onChange: (next: Partial<ServiceFilterState>) => void;
  onClear: () => void;
}) {
  function toggleCategory(category: ServiceCategory, checked: boolean) {
    const next = checked ? [...filters.categories, category] : filters.categories.filter((c) => c !== category);
    onChange({ categories: next });
  }

  return (
    <div className="flex flex-col gap-7">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-sm font-semibold text-foreground">Filters</h2>
        <button type="button" onClick={onClear} className="text-xs font-medium text-primary hover:underline">
          Clear all filters
        </button>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Service type</p>
        <div className="mt-3 flex flex-col gap-2.5">
          {serviceCategories.map((category) => (
            <label key={category} className="flex items-center gap-2.5 text-sm text-foreground">
              <Checkbox
                checked={filters.categories.includes(category)}
                onCheckedChange={(checked) => toggleCategory(category, checked === true)}
              />
              <CategoryIcon name={serviceCategoryIcons[category]} className="size-3.5 text-muted-foreground" />
              {serviceCategoryLabels[category]}
            </label>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5">
        <Label htmlFor="verified-only-filter" className="text-sm font-medium text-foreground">
          Verified only
        </Label>
        <Switch
          id="verified-only-filter"
          checked={filters.verifiedOnly}
          onCheckedChange={(checked) => onChange({ verifiedOnly: checked })}
        />
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Rating</p>
        <RadioGroup
          className="mt-3 flex flex-col gap-2.5"
          value={filters.minRating ? String(filters.minRating) : ""}
          onValueChange={(value) => onChange({ minRating: value ? Number(value) : undefined })}
        >
          <label className="flex items-center gap-2.5 text-sm text-foreground">
            <RadioGroupItem value="" />
            Any rating
          </label>
          {[4, 3].map((r) => (
            <label key={r} className="flex items-center gap-2.5 text-sm text-foreground">
              <RadioGroupItem value={String(r)} />
              {r}★ &amp; up
            </label>
          ))}
        </RadioGroup>
      </div>
    </div>
  );
}
