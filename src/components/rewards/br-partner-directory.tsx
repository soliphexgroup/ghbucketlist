"use client";

import { useMemo, useState } from "react";
import { MapPin, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useBrPartners } from "@/lib/db-br-partners";
import { cn } from "@/lib/utils";

export function BrPartnerDirectory() {
  const { partners, loaded } = useBrPartners();
  const [category, setCategory] = useState("all");

  const categories = useMemo(
    () => Array.from(new Set(partners.map((p) => p.category).filter(Boolean))) as string[],
    [partners]
  );

  const shown = category === "all" ? partners : partners.filter((p) => p.category === category);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-heading text-xl font-semibold text-foreground">Partner businesses</h2>
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <FilterChip label="All" active={category === "all"} onClick={() => setCategory("all")} />
            {categories.map((c) => (
              <FilterChip key={c} label={c} active={category === c} onClick={() => setCategory(c)} />
            ))}
          </div>
        )}
      </div>

      {!loaded ? (
        <p className="mt-6 text-sm text-muted-foreground">Loading partners…</p>
      ) : shown.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-border p-10 text-center">
          <p className="font-heading text-base font-semibold text-foreground">Partners coming soon</p>
          <p className="mt-1 text-sm text-muted-foreground">
            We&apos;re signing up businesses now. Join above so you&apos;re ready the moment they go live.
          </p>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((p) => (
            <div key={p.id} className="flex flex-col rounded-2xl border border-border bg-card p-5">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-heading text-base font-semibold text-foreground">{p.name}</h3>
                {p.tier !== "starter" && (
                  <Badge variant="outline" className="capitalize">{p.tier}</Badge>
                )}
              </div>
              <div className="mt-2 flex flex-col gap-1.5 text-sm text-muted-foreground">
                {p.category && (
                  <span className="flex items-center gap-1.5">
                    <Tag className="size-3.5 shrink-0" /> {p.category}
                  </span>
                )}
                {p.area && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="size-3.5 shrink-0" /> {p.area}
                  </span>
                )}
              </div>
              {p.description && <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{p.description}</p>}
              <div className="mt-4 flex items-center gap-2 rounded-lg bg-secondary/50 px-3 py-2 text-sm font-medium text-foreground">
                <span className="text-primary">Save {p.customerPct}%</span>
                <span className="text-muted-foreground">as a BR member</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1 text-xs font-medium capitalize transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border text-muted-foreground hover:text-foreground"
      )}
    >
      {label}
    </button>
  );
}
