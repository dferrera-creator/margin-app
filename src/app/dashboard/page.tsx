import { Suspense } from "react";
import { getDashboardData } from "@/lib/data";
import { parsePeriodFromParams } from "@/lib/period";
import { PeriodSelector } from "@/components/period-selector";
import { DashboardCards } from "@/components/dashboard-cards";
import { PropertiesTable } from "@/components/properties-table";
import { MarginChart } from "@/components/margin-chart";

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { month?: string; start?: string; end?: string };
}) {
  const period = parsePeriodFromParams(searchParams);
  const data = await getDashboardData(period);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Property-level financial overview
          </p>
        </div>
        <Suspense>
          <PeriodSelector />
        </Suspense>
      </div>

      <DashboardCards data={data} />

      <div className="grid gap-6 lg:grid-cols-2">
        <MarginChart properties={data.properties} />
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Properties</h2>
        <PropertiesTable properties={data.properties} />
      </div>
    </div>
  );
}
