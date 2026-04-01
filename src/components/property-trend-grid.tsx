"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, cn } from "@/lib/utils";
import type { PropertyTrend } from "@/lib/types";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from "recharts";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

export function PropertyTrendGrid({
  trends,
  showLinks = true,
}: {
  trends: PropertyTrend[];
  showLinks?: boolean;
}) {
  if (trends.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">
        No property data for this period
      </p>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {trends.map((prop) => {
        const latest = prop.months[prop.months.length - 1];
        const prev = prop.months.length > 1 ? prop.months[prop.months.length - 2] : null;

        const marginDelta =
          latest && prev && prev.grossPayout > 0
            ? (latest.netUtilityMargin - prev.netUtilityMargin)
            : null;

        return (
          <Card key={prop.propertyId}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-sm font-medium">
                    {prop.propertyNickname}
                  </CardTitle>
                  <Badge
                    variant={
                      prop.businessModel === "commission"
                        ? "secondary"
                        : "outline"
                    }
                    className="text-[10px]"
                  >
                    {prop.businessModel === "commission" ? "Comm" : "ML"}
                  </Badge>
                </div>
                {showLinks && (
                  <Link href={`/properties/${prop.propertyId}`}>
                    <Button variant="ghost" size="sm" className="h-7 px-2">
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </Link>
                )}
              </div>
              {/* Current period KPIs */}
              {latest && (
                <div className="flex gap-4 text-xs mt-1">
                  <div>
                    <span className="text-muted-foreground">Gross </span>
                    <span className="font-medium">
                      {formatCurrency(latest.grossPayout)}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Rev </span>
                    <span className="font-medium">
                      {formatCurrency(latest.delmarRevenue)}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Margin </span>
                    <span
                      className={cn(
                        "font-medium",
                        latest.netUtilityMargin >= 0
                          ? "text-green-600"
                          : "text-red-600"
                      )}
                    >
                      {formatCurrency(latest.netUtilityMargin)}
                    </span>
                  </div>
                  {marginDelta !== null && (
                    <div>
                      <span
                        className={cn(
                          "font-medium",
                          marginDelta >= 0
                            ? "text-green-600"
                            : "text-red-600"
                        )}
                      >
                        {marginDelta >= 0 ? "+" : ""}
                        {formatCurrency(marginDelta)}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </CardHeader>
            <CardContent>
              {prop.months.length < 2 ? (
                <p className="text-xs text-muted-foreground py-4 text-center">
                  Not enough data for trend
                </p>
              ) : (
                <div className="h-[140px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={prop.months.map((m) => ({
                        month: m.monthKey.slice(5), // "03"
                        revenue: m.delmarRevenue,
                        expenses: m.totalOperatingExpenses,
                        margin: m.netUtilityMargin,
                      }))}
                      margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis dataKey="month" fontSize={10} />
                      <YAxis fontSize={10} />
                      <Tooltip
                        formatter={(value) =>
                          `$${Number(value).toLocaleString(undefined, {
                            maximumFractionDigits: 0,
                          })}`
                        }
                        contentStyle={{ fontSize: 11 }}
                      />
                      <Bar
                        dataKey="revenue"
                        name="Revenue"
                        fill="hsl(222, 47%, 45%)"
                        radius={[2, 2, 0, 0]}
                      />
                      <Bar
                        dataKey="expenses"
                        name="Expenses"
                        fill="hsl(0, 70%, 60%)"
                        radius={[2, 2, 0, 0]}
                      />
                      <Bar
                        dataKey="margin"
                        name="Margin"
                        fill="hsl(142, 60%, 40%)"
                        radius={[2, 2, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
