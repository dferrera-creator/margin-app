"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Check, Filter, X } from "lucide-react";

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

  const selectedFromUrl = useMemo(
    () => searchParams.get("props")?.split(",").filter(Boolean) || [],
    [searchParams]
  );
  const [draftSelectedIds, setDraftSelectedIds] = useState<string[]>(selectedFromUrl);

  useEffect(() => {
    setDraftSelectedIds(selectedFromUrl);
  }, [selectedFromUrl]);

  const compBack = searchParams.get("comp") || "1";

  const toggleProperty = (id: string) => {
    setDraftSelectedIds((current) => {
      const selected = new Set(current);
      if (selected.has(id)) {
        selected.delete(id);
      } else {
        selected.add(id);
      }
      return Array.from(selected);
    });
  };

  const clearFilter = () => {
    setDraftSelectedIds([]);
    const params = new URLSearchParams(searchParams.toString());
    params.delete("props");
    router.push(`/dashboard?${params.toString()}`);
  };

  const selectAll = () => {
    setDraftSelectedIds([]);
  };

  const applyFilter = () => {
    const params = new URLSearchParams(searchParams.toString());
    if (draftSelectedIds.length === 0 || draftSelectedIds.length === properties.length) {
      params.delete("props");
    } else {
      params.set("props", draftSelectedIds.join(","));
    }
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

  const hasFilter = selectedFromUrl.length > 0;
  const hasDraftChanges =
    [...draftSelectedIds].sort().join(",") !== [...selectedFromUrl].sort().join(",");

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
              {selectedFromUrl.length}
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
        <div className="rounded-md border p-3 bg-muted/30 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
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
            <Button
              size="sm"
              onClick={applyFilter}
              disabled={!hasDraftChanges}
            >
              <Check className="h-3 w-3 mr-1" />
              Apply
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {properties.map((p) => {
              const isSelected =
                draftSelectedIds.length === 0 || draftSelectedIds.includes(p.id);
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
