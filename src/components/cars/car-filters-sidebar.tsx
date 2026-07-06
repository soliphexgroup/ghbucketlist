"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CategoryIcon } from "@/components/category-icon";
import { carFeatures } from "@/data/car-features";
import { carPriceBounds } from "@/lib/car-repository";
import { formatGHS } from "@/lib/format";
import type { CarCategory } from "@/lib/car-types";
import type { CarFilterState } from "@/components/cars/car-browser";

const categoryOptions: { value: CarCategory; label: string }[] = [
  { value: "economy", label: "Economy" },
  { value: "suv", label: "SUV" },
  { value: "luxury", label: "Luxury" },
  { value: "van", label: "Van" },
];

export function CarFiltersSidebar({
  filters,
  onChange,
  onClear,
}: {
  filters: CarFilterState;
  onChange: (next: Partial<CarFilterState>) => void;
  onClear: () => void;
}) {
  const bounds = carPriceBounds();

  function toggleCategory(category: CarCategory, checked: boolean) {
    const next = checked ? [...filters.categories, category] : filters.categories.filter((c) => c !== category);
    onChange({ categories: next });
  }

  function toggleFeature(key: string, checked: boolean) {
    const next = checked ? [...filters.features, key] : filters.features.filter((f) => f !== key);
    onChange({ features: next });
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
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Vehicle type</p>
        <div className="mt-3 flex flex-col gap-2.5">
          {categoryOptions.map((opt) => (
            <label key={opt.value} className="flex items-center gap-2.5 text-sm text-foreground">
              <Checkbox
                checked={filters.categories.includes(opt.value)}
                onCheckedChange={(checked) => toggleCategory(opt.value, checked === true)}
              />
              {opt.label}
            </label>
          ))}
        </div>
      </div>

      <div>
        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Seats</Label>
        <div className="mt-2 flex items-center justify-between rounded-lg border border-border px-3 py-1.5">
          <span className="text-sm text-foreground">Minimum seats</span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onChange({ seats: Math.max(1, filters.seats - 1) })}
              className="flex size-7 items-center justify-center rounded-full border border-border text-foreground hover:bg-muted"
              aria-label="Decrease seats"
            >
              −
            </button>
            <span className="w-4 text-center text-sm font-medium text-foreground">{filters.seats}</span>
            <button
              type="button"
              onClick={() => onChange({ seats: Math.min(14, filters.seats + 1) })}
              className="flex size-7 items-center justify-center rounded-full border border-border text-foreground hover:bg-muted"
              aria-label="Increase seats"
            >
              +
            </button>
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Price per day</p>
          <span className="text-xs font-medium text-foreground">Up to {formatGHS(filters.maxPrice)}</span>
        </div>
        <Slider
          className="mt-4"
          min={bounds.min}
          max={bounds.max}
          step={20}
          value={[filters.maxPrice]}
          onValueChange={([value]) => onChange({ maxPrice: value })}
        />
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Transmission</p>
        <RadioGroup
          className="mt-3 flex flex-col gap-2.5"
          value={filters.transmission ?? ""}
          onValueChange={(value) => onChange({ transmission: value ? (value as CarFilterState["transmission"]) : undefined })}
        >
          <label className="flex items-center gap-2.5 text-sm text-foreground">
            <RadioGroupItem value="" />
            Any transmission
          </label>
          <label className="flex items-center gap-2.5 text-sm text-foreground">
            <RadioGroupItem value="automatic" />
            Automatic
          </label>
          <label className="flex items-center gap-2.5 text-sm text-foreground">
            <RadioGroupItem value="manual" />
            Manual
          </label>
        </RadioGroup>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Features</p>
        <div className="mt-3 flex flex-col gap-2.5">
          {carFeatures.slice(0, 8).map((f) => (
            <label key={f.key} className="flex items-center gap-2.5 text-sm text-foreground">
              <Checkbox
                checked={filters.features.includes(f.key)}
                onCheckedChange={(checked) => toggleFeature(f.key, checked === true)}
              />
              <CategoryIcon name={f.icon} className="size-3.5 text-muted-foreground" />
              {f.label}
            </label>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5">
        <Label htmlFor="driver-available-filter" className="text-sm font-medium text-foreground">
          Driver available
        </Label>
        <Switch
          id="driver-available-filter"
          checked={filters.driverAvailableOnly}
          onCheckedChange={(checked) => onChange({ driverAvailableOnly: checked })}
        />
      </div>

      <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5">
        <Label htmlFor="instant-book-filter-cars" className="text-sm font-medium text-foreground">
          Instant Book only
        </Label>
        <Switch
          id="instant-book-filter-cars"
          checked={filters.instantBookOnly}
          onCheckedChange={(checked) => onChange({ instantBookOnly: checked })}
        />
      </div>
    </div>
  );
}
