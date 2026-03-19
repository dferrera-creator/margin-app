import { Suspense } from "react";
import { getDashboardData } from "@/lib/data";
import { parsePeriodFromParams } from "@/lib/period";
import { PeriodSelector } from "@/components/period-selector";
import { PropertiesTable } from "@/components/properties-table";

export const dynamic = "force-dynamic";

export default async function PropertiesPage({
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
          <h1 className="text-3xl font-bold tracking-tight">Properties</h1>
          <p className="text-muted-foreground">
            {data.propertyCount} active properties
          </p>
        </div>
        <Suspense>
          <PeriodSelector />
        </Suspense>
      </div>

      <PropertiesTable properties={data.properties} />
    </div>
  );
}
