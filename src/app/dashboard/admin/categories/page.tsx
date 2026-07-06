"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { CategoryIcon } from "@/components/category-icon";
import { categories as initialCategories } from "@/data/categories";

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState(initialCategories);
  const [inactive, setInactive] = useState<Set<string>>(new Set());

  function move(index: number, direction: -1 | 1) {
    const next = [...categories];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setCategories(next);
  }

  function toggleActive(id: string) {
    setInactive((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-foreground">Categories</h1>
      <p className="mt-1 text-muted-foreground">
        Manage experience categories and their display order on the homepage.
      </p>

      <div className="mt-6 flex flex-col gap-2">
        {categories.map((category, index) => (
          <div key={category.id} className="flex items-center gap-4 rounded-2xl border border-border p-3">
            <div className="flex flex-col">
              <button
                onClick={() => move(index, -1)}
                disabled={index === 0}
                className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                aria-label="Move up"
              >
                <ArrowUp className="size-3.5" />
              </button>
              <button
                onClick={() => move(index, 1)}
                disabled={index === categories.length - 1}
                className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                aria-label="Move down"
              >
                <ArrowDown className="size-3.5" />
              </button>
            </div>
            <span
              className="flex size-9 items-center justify-center rounded-full"
              style={{ backgroundColor: `${category.colorHex}1A`, color: category.colorHex }}
            >
              <CategoryIcon name={category.icon} className="size-4" />
            </span>
            <div className="flex-1">
              <p className="font-medium text-foreground">{category.name}</p>
              <p className="text-xs text-muted-foreground">/{category.slug}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {inactive.has(category.id) ? "Inactive" : "Active"}
              </span>
              <Switch checked={!inactive.has(category.id)} onCheckedChange={() => toggleActive(category.id)} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
