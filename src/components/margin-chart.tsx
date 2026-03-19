"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { PropertyFinancialSummary } from "@/lib/types";
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
} from "recharts";

export function MarginChart({
  properties,
}: {
  properties: PropertyFinancialSummary[];
}) {
  // Revenue vs Expenses bar chart
  const revenueData = properties
    .filter((p) => p.grossPayout > 0)
    .sort((a, b) => b.netUtilityMargin - a.netUtilityMargin)
    .map((p) => ({
      name:
        p.propertyNickname.length > 15
          ? p.propertyNickname.slice(0, 15) + "..."
          : p.propertyNickname,
      revenue: p.delmarRevenue,
      expenses: p.totalOperatingExpenses,
      margin: p.netUtilityMargin,
    }));

  // Margin % chart
  const marginData = properties
    .filter((p) => p.utilityMarginPercentGross !== null)
    .sort(
      (a, b) =>
        (b.utilityMarginPercentGross ?? 0) - (a.utilityMarginPercentGross ?? 0)
    )
    .map((p) => ({
      name:
        p.propertyNickname.length > 15
          ? p.propertyNickname.slice(0, 15) + "..."
          : p.propertyNickname,
      marginPercent: p.utilityMarginPercentGross ?? 0,
    }));

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Revenue vs Expenses</CardTitle>
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
                <Tooltip
                  formatter={(value) =>
                    `$${Number(value).toLocaleString()}`
                  }
                />
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
          <CardTitle className="text-base">Utility Margin % (Gross)</CardTitle>
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
                <Tooltip formatter={(value) => `${Number(value).toFixed(1)}%`} />
                <Bar dataKey="marginPercent" name="Margin %" radius={[4, 4, 0, 0]}>
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
