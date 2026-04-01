"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatCurrency, formatPercent, cn } from "@/lib/utils";
import type { DashboardSummary, MonthKPI } from "@/lib/types";
import {
  DollarSign,
  TrendingUp,
  Receipt,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from "lucide-react";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
} from "recharts";

interface Props {
  current: DashboardSummary;
  comparison: DashboardSummary | null;
  monthlyKPIs: MonthKPI[];
}

interface CardDef {
  title: string;
  currentValue: number;
  comparisonValue: number | null;
  icon: typeof DollarSign;
  description: string;
  sparkData: { value: number }[];
  format: (v: number) => string;
  /** For expenses, "down" is good */
  invertDelta?: boolean;
}

export function DashboardCards({ current, comparison, monthlyKPIs }: Props) {
  const cards: CardDef[] = [
    {
      title: "Gross Payout",
      currentValue: current.totalGrossPayout,
      comparisonValue: comparison?.totalGrossPayout ?? null,
      icon: DollarSign,
      description: `${current.propertyCount} properties`,
      sparkData: monthlyKPIs.map((m) => ({ value: m.grossPayout })),
      format: formatCurrency,
    },
    {
      title: "Delmar Revenue",
      currentValue: current.totalDelmarRevenue,
      comparisonValue: comparison?.totalDelmarRevenue ?? null,
      icon: TrendingUp,
      description: "After owner payouts",
      sparkData: monthlyKPIs.map((m) => ({ value: m.delmarRevenue })),
      format: formatCurrency,
    },
    {
      title: "Operating Expenses",
      currentValue: current.totalOperatingExpenses,
      comparisonValue: comparison?.totalOperatingExpenses ?? null,
      icon: Receipt,
      description: "Total across all properties",
      sparkData: monthlyKPIs.map((m) => ({
        value: m.totalOperatingExpenses,
      })),
      format: formatCurrency,
      invertDelta: true,
    },
    {
      title: "Utility Margin",
      currentValue: current.totalUtilityMargin,
      comparisonValue: comparison?.totalUtilityMargin ?? null,
      icon: BarChart3,
      description: `Avg ${formatPercent(current.averageUtilityMarginPercent)} on gross`,
      sparkData: monthlyKPIs.map((m) => ({ value: m.netUtilityMargin })),
      format: formatCurrency,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        const delta =
          card.comparisonValue !== null && card.comparisonValue !== 0
            ? ((card.currentValue - card.comparisonValue) /
                Math.abs(card.comparisonValue)) *
              100
            : null;

        const deltaIsGood =
          delta !== null
            ? card.invertDelta
              ? delta <= 0
              : delta >= 0
            : null;

        // Spark color based on overall trend
        const sparkColor = deltaIsGood === null
          ? "hsl(222, 47%, 50%)"
          : deltaIsGood
            ? "hsl(142, 76%, 36%)"
            : "hsl(0, 84%, 60%)";

        return (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {card.title}
              </CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between gap-2">
                <div className="space-y-1">
                  <div className="text-2xl font-bold">
                    {card.format(card.currentValue)}
                  </div>
                  {delta !== null ? (
                    <div
                      className={cn(
                        "flex items-center gap-1 text-xs font-medium",
                        deltaIsGood
                          ? "text-green-600"
                          : "text-red-600"
                      )}
                    >
                      {delta > 0 ? (
                        <ArrowUpRight className="h-3 w-3" />
                      ) : delta < 0 ? (
                        <ArrowDownRight className="h-3 w-3" />
                      ) : (
                        <Minus className="h-3 w-3" />
                      )}
                      {Math.abs(delta).toFixed(1)}% vs prior
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      {card.description}
                    </p>
                  )}
                </div>

                {/* Sparkline */}
                {card.sparkData.length > 1 && (
                  <div className="w-20 h-10">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={card.sparkData}>
                        <defs>
                          <linearGradient
                            id={`spark-${card.title}`}
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="0%"
                              stopColor={sparkColor}
                              stopOpacity={0.3}
                            />
                            <stop
                              offset="100%"
                              stopColor={sparkColor}
                              stopOpacity={0}
                            />
                          </linearGradient>
                        </defs>
                        <Area
                          type="monotone"
                          dataKey="value"
                          stroke={sparkColor}
                          fill={`url(#spark-${card.title})`}
                          strokeWidth={1.5}
                          dot={false}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
