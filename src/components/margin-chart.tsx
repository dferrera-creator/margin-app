"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { PropertyFinancialSummary } from "@/lib/types";
import { formatCurrency, cn } from "@/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
  ReferenceLine,
} from "recharts";

type SortMode = "margin" | "name" | "revenue";
type MetricMode = "gross" | "delmar";

function SortToggle({
  value,
  onChange,
}: {
  value: SortMode;
  onChange: (v: SortMode) => void;
}) {
  return (
    <div className="flex items-center gap-1 rounded-md border p-1">
      {(["margin", "name", "revenue"] as const).map((mode) => (
        <button
          key={mode}
          onClick={() => onChange(mode)}
          className={cn(
            "px-2 py-0.5 rounded text-xs transition-colors",
            value === mode
              ? "bg-primary text-primary-foreground"
              : "hover:bg-muted"
          )}
        >
          {mode === "margin" ? "Margin" : mode === "name" ? "Name" : "Revenue"}
        </button>
      ))}
    </div>
  );
}

export function MarginChart({
  properties,
}: {
  properties: PropertyFinancialSummary[];
}) {
  const [revenueSort, setRevenueSort] = useState<SortMode>("margin");
  const [marginSort, setMarginSort] = useState<SortMode>("margin");
  const [marginMetric, setMarginMetric] = useState<MetricMode>("gross");

  // Revenue vs Expenses chart data
  const revenueFiltered = properties.filter((p) => p.grossPayout > 0);
  const revenueSorted = [...revenueFiltered].sort((a, b) => {
    if (revenueSort === "name")
      return a.propertyNickname.localeCompare(b.propertyNickname);
    if (revenueSort === "revenue") return b.delmarRevenue - a.delmarRevenue;
    return b.netUtilityMargin - a.netUtilityMargin;
  });
  const revenueData = revenueSorted.map((p) => ({
    name:
      p.propertyNickname.length > 15
        ? p.propertyNickname.slice(0, 15) + "…"
        : p.propertyNickname,
    fullName: p.propertyNickname,
    revenue: p.delmarRevenue,
    expenses: p.totalOperatingExpenses,
    margin: p.netUtilityMargin,
  }));

  // Margin % chart data
  const marginFiltered = properties.filter(
    (p) =>
      p.utilityMarginPercentGross !== null ||
      p.utilityMarginPercentDelmar !== null
  );
  const marginSorted = [...marginFiltered].sort((a, b) => {
    if (marginSort === "name")
      return a.propertyNickname.localeCompare(b.propertyNickname);
    if (marginSort === "revenue") return b.delmarRevenue - a.delmarRevenue;
    const aVal =
      marginMetric === "gross"
        ? (a.utilityMarginPercentGross ?? 0)
        : (a.utilityMarginPercentDelmar ?? 0);
    const bVal =
      marginMetric === "gross"
        ? (b.utilityMarginPercentGross ?? 0)
        : (b.utilityMarginPercentDelmar ?? 0);
    return bVal - aVal;
  });
  const marginData = marginSorted.map((p) => ({
    name:
      p.propertyNickname.length > 15
        ? p.propertyNickname.slice(0, 15) + "…"
        : p.propertyNickname,
    fullName: p.propertyNickname,
    marginPercent:
      marginMetric === "gross"
        ? (p.utilityMarginPercentGross ?? 0)
        : (p.utilityMarginPercentDelmar ?? 0),
    revenue: p.delmarRevenue,
    expenses: p.totalOperatingExpenses,
    margin: p.netUtilityMargin,
    pctGross: p.utilityMarginPercentGross,
    pctDelmar: p.utilityMarginPercentDelmar,
  }));

  // Custom tooltips
  const RevenueTooltip = ({
    active,
    payload,
  }: {
    active?: boolean;
    payload?: Array<{ payload: (typeof revenueData)[0] }>;
  }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
      <div className="rounded-md border bg-white p-3 text-xs shadow-lg space-y-1 min-w-[160px]">
        <p className="font-semibold text-sm">{d.fullName}</p>
        <p className="text-muted-foreground">
          Revenue:{" "}
          <span className="text-foreground font-medium">
            {formatCurrency(d.revenue)}
          </span>
        </p>
        <p className="text-muted-foreground">
          Expenses:{" "}
          <span className="text-foreground font-medium">
            {formatCurrency(d.expenses)}
          </span>
        </p>
        <p className="text-muted-foreground">
          Margin:{" "}
          <span
            className={cn(
              "font-medium",
              d.margin >= 0 ? "text-green-700" : "text-red-600"
            )}
          >
            {formatCurrency(d.margin)}
          </span>
        </p>
      </div>
    );
  };

  const MarginTooltip = ({
    active,
    payload,
  }: {
    active?: boolean;
    payload?: Array<{ payload: (typeof marginData)[0] }>;
  }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
      <div className="rounded-md border bg-white p-3 text-xs shadow-lg space-y-1 min-w-[160px]">
        <p className="font-semibold text-sm">{d.fullName}</p>
        <p className="text-muted-foreground">
          Margin $:{" "}
          <span
            className={cn(
              "font-medium",
              d.margin >= 0 ? "text-green-700" : "text-red-600"
            )}
          >
            {formatCurrency(d.margin)}
          </span>
        </p>
        <p className="text-muted-foreground">
          % of Gross:{" "}
          <span className="font-medium">
            {d.pctGross !== null ? `${d.pctGross.toFixed(1)}%` : "N/A"}
          </span>
        </p>
        <p className="text-muted-foreground">
          % of Delmar:{" "}
          <span className="font-medium">
            {d.pctDelmar !== null ? `${d.pctDelmar.toFixed(1)}%` : "N/A"}
          </span>
        </p>
        <p className="text-muted-foreground">
          Revenue:{" "}
          <span className="font-medium">{formatCurrency(d.revenue)}</span>
        </p>
        <p className="text-muted-foreground">
          Expenses:{" "}
          <span className="font-medium">{formatCurrency(d.expenses)}</span>
        </p>
      </div>
    );
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="text-base">Revenue vs Expenses</CardTitle>
            <SortToggle value={revenueSort} onChange={setRevenueSort} />
          </div>
        </CardHeader>
        <CardContent>
          {revenueData.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No data for this period
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" fontSize={11} />
                <YAxis fontSize={11} />
                <Tooltip content={<RevenueTooltip />} />
                <Legend />
                <Bar
                  dataKey="revenue"
                  name="Delmar Revenue"
                  fill="hsl(222, 47%, 31%)"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="expenses"
                  name="Expenses"
                  fill="hsl(0, 84%, 60%)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="text-base">
              Utility Margin %{" "}
              <span className="text-muted-foreground font-normal text-sm">
                ({marginMetric === "gross" ? "of Gross Payout" : "of Delmar Revenue"})
              </span>
            </CardTitle>
            <div className="flex items-center gap-2">
              <SortToggle value={marginSort} onChange={setMarginSort} />
              <div className="flex items-center gap-1 rounded-md border p-1">
                {(["gross", "delmar"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMarginMetric(m)}
                    className={cn(
                      "px-2 py-0.5 rounded text-xs transition-colors",
                      marginMetric === m
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted"
                    )}
                  >
                    {m === "gross" ? "% Gross" : "% Delmar"}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {marginData.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No data for this period
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={marginData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" fontSize={11} />
                <YAxis fontSize={11} unit="%" />
                <ReferenceLine y={0} stroke="hsl(0, 0%, 40%)" strokeWidth={1.5} />
                <Tooltip content={<MarginTooltip />} />
                <Bar
                  dataKey="marginPercent"
                  name="Margin %"
                  radius={[4, 4, 0, 0]}
                >
                  {marginData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        entry.marginPercent >= 0
                          ? "hsl(142, 76%, 36%)"
                          : "hsl(0, 84%, 60%)"
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </>
  );
}
