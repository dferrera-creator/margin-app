import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatCurrency, formatPercent } from "@/lib/utils";
import type { DashboardSummary } from "@/lib/types";
import {
  DollarSign,
  TrendingUp,
  Receipt,
  BarChart3,
} from "lucide-react";

export function DashboardCards({ data }: { data: DashboardSummary }) {
  const cards = [
    {
      title: "Gross Payout",
      value: formatCurrency(data.totalGrossPayout),
      icon: DollarSign,
      description: `${data.propertyCount} active properties`,
    },
    {
      title: "Delmar Revenue",
      value: formatCurrency(data.totalDelmarRevenue),
      icon: TrendingUp,
      description: "After owner payouts",
    },
    {
      title: "Operating Expenses",
      value: formatCurrency(data.totalOperatingExpenses),
      icon: Receipt,
      description: "Total across all properties",
    },
    {
      title: "Utility Margin",
      value: formatCurrency(data.totalUtilityMargin),
      icon: BarChart3,
      description: `Avg ${formatPercent(data.averageUtilityMarginPercent)} on gross`,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {card.title}
              </CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <p className="text-xs text-muted-foreground">
                {card.description}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
