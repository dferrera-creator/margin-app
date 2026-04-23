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
  Cell,
} from "recharts";

const BUCKETS = [
  { label: "40%+",     color: "hsl(142, 76%, 36%)", test: (p: number) => p >= 40 },
  { label: "25–40%",   color: "hsl(142, 55%, 45%)", test: (p: number) => p >= 25 && p < 40 },
  { label: "15–25%",   color: "hsl(80, 60%, 42%)",  test: (p: number) => p >= 15 && p < 25 },
  { label: "0–15%",    color: "hsl(48, 95%, 45%)",  test: (p: number) => p >= 0 && p < 15 },
  { label: "-10–0%",   color: "hsl(32, 95%, 55%)",  test: (p: number) => p >= -10 && p < 0 },
  { label: "-20–-10%", color: "hsl(16, 90%, 55%)",  test: (p: number) => p >= -20 && p < -10 },
  { label: "-30%+",    color: "hsl(0, 84%, 60%)",   test: (p: number) => p < -20 },
] as const;

type BucketRow = {
  label: string;
  count: number;
  color: string;
  propertyNames: string[];
};

const DistributionTooltip = ({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: BucketRow }>;
}) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  if (d.count === 0) return null;
  return (
    <div className="rounded-md border bg-white p-3 text-xs shadow-lg space-y-1 min-w-[160px] max-w-[220px]">
      <p className="font-semibold">
        {d.label} — {d.count} {d.count === 1 ? "property" : "properties"}
      </p>
      <ul className="mt-1 space-y-0.5">
        {d.propertyNames.map((name) => (
          <li key={name} className="text-muted-foreground truncate">
            {name}
          </li>
        ))}
      </ul>
    </div>
  );
};

export function MarginDistributionChart({
  properties,
}: {
  properties: PropertyFinancialSummary[];
}) {
  const eligible = properties.filter(
    (p) => p.utilityMarginPercentGross !== null
  );

  const chartData: BucketRow[] = BUCKETS.map((bucket) => {
    const matched = eligible.filter((p) =>
      bucket.test(p.utilityMarginPercentGross as number)
    );
    return {
      label: bucket.label,
      count: matched.length,
      color: bucket.color,
      propertyNames: matched.map((p) => p.propertyNickname),
    };
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Margin Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        {eligible.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">
            No data for this period
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart
              data={chartData}
              margin={{ top: 8, right: 8, left: -12, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" fontSize={11} />
              <YAxis
                fontSize={11}
                allowDecimals={false}
                label={{
                  value: "# Properties",
                  angle: -90,
                  position: "insideLeft",
                  offset: 14,
                  style: { fontSize: 10 },
                }}
              />
              <Tooltip content={<DistributionTooltip />} />
              <Bar dataKey="count" name="Properties" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
