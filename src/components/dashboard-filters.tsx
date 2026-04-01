"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Filter, X } from "lucide-react";
import { useState } from "react";

interface PropertyOption {
  id: string;
  nickname: string;
}

export function DashboardFilters({
  properties,
}: {
  properties: PropertyOption[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);

  const selectedIds = searchParams.get("props")?.split(",").filter(Boolean) || [];
  const compBack = searchParams.get("comp") || "1";

  const toggleProperty = (id: string) => {
    const params = new URLSearchParams(searchParams.toString());
    const current = new Set(selectedIds);
    if (current.has(id)) {
      current.delete(id);
    } else {
      current.add(id);
    }
    if (current.size === 0 || current.size === properties.length) {
      params.delete("props");
    } else {
      params.set("props", Array.from(current).join(","));
    }
    router.push(`/dashboard?${params.toString()}`);
  };

  const clearFilter = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("props");
    router.push(`/dashboard?${params.toString()}`);
  };

  const selectAll = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("props");
    router.push(`/dashboard?${params.toString()}`);
  };

  const setComparison = (months: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (months === "1") {
      params.delete("comp");
    } else {
      params.set("comp", months);
    }
    router.push(`/dashboard?${params.toString()}`);
  };

  const hasFilter = selectedIds.length > 0;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant={open ? "default" : "outline"}
          size="sm"
          onClick={() => setOpen(!open)}
        >
          <Filter className="h-4 w-4 mr-1" />
          Filter Properties
          {hasFilter && (
            <span className="ml-1 bg-primary-foreground text-primary rounded-full px-1.5 text-xs font-bold">
              {selectedIds.length}
            </span>
          )}
        </Button>

        {hasFilter && (
          <Button variant="ghost" size="sm" onClick={clearFilter}>
            <X className="h-3 w-3 mr-1" />
            Clear
          </Button>
        )}

        <div className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
          <span>Compare to:</span>
          {[
            { val: "1", label: "Last month" },
            { val: "3", label: "3mo ago" },
            { val: "6", label: "6mo ago" },
            { val: "12", label: "Last year" },
          ].map((opt) => (
            <button
              key={opt.val}
              onClick={() => setComparison(opt.val)}
              className={cn(
                "px-2 py-0.5 rounded text-xs transition-colors",
                compBack === opt.val
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {open && (
        <div className="rounded-md border p-3 bg-muted/30">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-medium text-muted-foreground">
              Select properties to include:
            </span>
            <button
              onClick={selectAll}
              className="text-xs text-primary hover:underline"
            >
              All
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {properties.map((p) => {
              const isSelected =
                selectedIds.length === 0 || selectedIds.includes(p.id);
              return (
                <button
                  key={p.id}
                  onClick={() => toggleProperty(p.id)}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-sm border transition-colors",
                    isSelected
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-muted-foreground border-border hover:border-primary/50"
                  )}
                >
                  {p.nickname}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
