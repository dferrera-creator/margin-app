"use client";

import { useState } from "react";
import Link from "next/link";
import { formatCurrency, formatPercent, cn } from "@/lib/utils";
import type { PropertyFinancialSummary } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, Search, ExternalLink } from "lucide-react";

type SortKey =
  | "nickname"
  | "grossPayout"
  | "delmarRevenue"
  | "totalOperatingExpenses"
  | "netUtilityMargin"
  | "utilityMarginPercentGross"
  | "nightsBooked";

export function PropertiesTable({
  properties,
}: {
  properties: PropertyFinancialSummary[];
}) {
  const [search, setSearch] = useState("");
  const [modelFilter, setModelFilter] = useState<"all" | "commission" | "master_lease">("all");
  const [sortKey, setSortKey] = useState<SortKey>("netUtilityMargin");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const filtered = properties
    .filter((p) =>
      p.propertyNickname.toLowerCase().includes(search.toLowerCase())
    )
    .filter((p) => modelFilter === "all" || p.businessModel === modelFilter)
    .sort((a, b) => {
      const getValue = (item: PropertyFinancialSummary): string | number => {
        if (sortKey === "nickname") return item.propertyNickname;
        return (item[sortKey as keyof PropertyFinancialSummary] as number) ?? 0;
      };
      const aVal = getValue(a);
      const bVal = getValue(b);
      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortDir === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }
      return sortDir === "asc"
        ? (aVal as number) - (bVal as number)
        : (bVal as number) - (aVal as number);
    });

  const SortHeader = ({
    label,
    sortField,
  }: {
    label: string;
    sortField: SortKey;
  }) => (
    <button
      onClick={() => toggleSort(sortField)}
      className="flex items-center gap-1 hover:text-foreground transition-colors"
    >
      {label}
      <ArrowUpDown className="h-3 w-3" />
    </button>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-sm flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search properties..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-1 rounded-md border p-1">
          {(["all", "commission", "master_lease"] as const).map((model) => (
            <button
              key={model}
              onClick={() => setModelFilter(model)}
              className={cn(
                "px-3 py-1 rounded text-sm transition-colors",
                modelFilter === model
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted"
              )}
            >
              {model === "all" ? "All" : model === "commission" ? "Commission" : "Master Lease"}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-md border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-muted-foreground">
              <th className="text-left p-3 font-medium">
                <SortHeader label="Property" sortField="nickname" />
              </th>
              <th className="text-left p-3 font-medium">Model</th>
              <th className="text-right p-3 font-medium">
                <SortHeader label="Gross Payout" sortField="grossPayout" />
              </th>
              <th className="text-right p-3 font-medium">Owner Payout</th>
              <th className="text-right p-3 font-medium">
                <SortHeader label="Delmar Rev" sortField="delmarRevenue" />
              </th>
              <th className="text-right p-3 font-medium">
                <SortHeader label="OpEx" sortField="totalOperatingExpenses" />
              </th>
              <th className="text-right p-3 font-medium">
                <SortHeader label="Margin" sortField="netUtilityMargin" />
              </th>
              <th className="text-right p-3 font-medium">
                <SortHeader
                  label="Margin %"
                  sortField="utilityMarginPercentGross"
                />
              </th>
              <th className="text-right p-3 font-medium">
                <SortHeader label="Nights" sortField="nightsBooked" />
              </th>
              <th className="text-right p-3 font-medium">Stays</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={11}
                  className="text-center py-8 text-muted-foreground"
                >
                  No properties found
                </td>
              </tr>
            ) : (
              filtered.map((p) => (
                <tr
                  key={p.propertyId}
                  className="border-b hover:bg-muted/30 transition-colors"
                >
                  <td className="p-3 font-medium">{p.propertyNickname}</td>
                  <td className="p-3">
                    <Badge
                      variant={
                        p.businessModel === "commission"
                          ? "secondary"
                          : "outline"
                      }
                    >
                      {p.businessModel === "commission"
                        ? "Commission"
                        : "Master Lease"}
                    </Badge>
                  </td>
                  <td className="p-3 text-right">
                    {formatCurrency(p.grossPayout)}
                  </td>
                  <td className="p-3 text-right">
                    {formatCurrency(p.ownerPayout)}
                  </td>
                  <td className="p-3 text-right">
                    {formatCurrency(p.delmarRevenue)}
                  </td>
                  <td className="p-3 text-right">
                    {formatCurrency(p.totalOperatingExpenses)}
                  </td>
                  <td
                    className={cn(
                      "p-3 text-right font-medium",
                      p.netUtilityMargin >= 0
                        ? "text-green-700"
                        : "text-red-600"
                    )}
                  >
                    {formatCurrency(p.netUtilityMargin)}
                  </td>
                  <td
                    className={cn(
                      "p-3 text-right",
                      (p.utilityMarginPercentGross ?? 0) >= 0
                        ? "text-green-700"
                        : "text-red-600"
                    )}
                  >
                    {formatPercent(p.utilityMarginPercentGross)}
                  </td>
                  <td className="p-3 text-right">{p.nightsBooked}</td>
                  <td className="p-3 text-right">{p.staysBooked}</td>
                  <td className="p-3">
                    <Link href={`/properties/${p.propertyId}`}>
                      <Button variant="ghost" size="sm">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
