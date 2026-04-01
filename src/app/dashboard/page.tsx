import { Suspense } from "react";
import { getDashboardTrendData, getAllProperties } from "@/lib/data";
import { parsePeriodFromParams } from "@/lib/period";
import { PeriodSelector } from "@/components/period-selector";
import { DashboardCards } from "@/components/dashboard-cards";
import { DashboardFilters } from "@/components/dashboard-filters";
import { PropertiesTable } from "@/components/properties-table";
import { MarginChart } from "@/components/margin-chart";
import { DashboardMapGraph } from "@/components/dashboard-map-graph";

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: {
    month?: string;
    start?: string;
    end?: string;
    props?: string;
    comp?: string;
  };
}) {
  const period = parsePeriodFromParams(searchParams);
  const selectedProps = searchParams.props
    ?.split(",")
    .filter(Boolean) || [];
  const compBack = Number(searchParams.comp) || 1;

  const [trendData, allProperties] = await Promise.all([
    getDashboardTrendData(period, {
      propertyIds: selectedProps.length > 0 ? selectedProps : undefined,
      comparisonMonthsBack: compBack,
      trendMonths: 6,
    }),
    getAllProperties(),
  ]);

  const propertyOptions = allProperties.map((p) => ({
    id: p.id,
    nickname: p.nickname,
  }));

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

      <Suspense>
        <DashboardFilters properties={propertyOptions} />
      </Suspense>

      <DashboardCards
        current={trendData.current}
        comparison={trendData.comparison}
        monthlyKPIs={trendData.monthlyKPIs}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <MarginChart properties={trendData.current.properties} />
        <DashboardMapGraph
          properties={trendData.current.properties.map((p) => ({
            propertyId: p.propertyId,
            nickname: p.propertyNickname,
            title: allProperties.find((ap) => ap.id === p.propertyId)?.title ?? null,
            margin: p.netUtilityMargin,
          }))}
        />
      </div>
      </div>


      <div>
        <h2 className="text-xl font-semibold mb-4">Properties</h2>
        <PropertiesTable
          properties={trendData.current.properties}
          trendByProperty={Object.fromEntries(
            trendData.propertyTrends.map((trend) => {
              const latest = trend.months[trend.months.length - 1];
              const previous = trend.months[trend.months.length - 2];
              const delta =
                latest && previous
                  ? latest.netUtilityMargin - previous.netUtilityMargin
                  : null;

              return [trend.propertyId, delta];
            })
          )}
        />
      </div>
    </div>
  );
}
