import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getPropertyById, getPropertyFinancials, getPropertyReservations } from "@/lib/data";
import { parsePeriodFromParams } from "@/lib/period";
import { PeriodSelector } from "@/components/period-selector";
import { PropertyHeader } from "@/components/property-header";
import { PropertyFinancials } from "@/components/property-financials";
import { ExpenseOverrideForm } from "@/components/expense-override-form";
import { ReservationsTable } from "@/components/reservations-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const dynamic = "force-dynamic";

export default async function PropertyDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { month?: string; start?: string; end?: string };
}) {
  let property;
  try {
    property = await getPropertyById(params.id);
  } catch {
    notFound();
  }

  const period = parsePeriodFromParams(searchParams);
  const financials = await getPropertyFinancials(params.id, period);
  const reservations = await getPropertyReservations(params.id, period);

  const monthKey = searchParams.month || new Date().toISOString().slice(0, 7);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PropertyHeader property={property} />
        <Suspense>
          <PeriodSelector />
        </Suspense>
      </div>

      <Tabs defaultValue="financials">
        <TabsList>
          <TabsTrigger value="financials">Financials</TabsTrigger>
          <TabsTrigger value="expenses">Expense Overrides</TabsTrigger>
          <TabsTrigger value="reservations">
            Reservations ({reservations.length})
          </TabsTrigger>
          <TabsTrigger value="settings">Property Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="financials" className="space-y-6">
          <PropertyFinancials financials={financials} />
        </TabsContent>

        <TabsContent value="expenses">
          <ExpenseOverrideForm
            propertyId={params.id}
            monthKey={monthKey}
            financials={financials}
          />
        </TabsContent>

        <TabsContent value="reservations">
          <ReservationsTable reservations={reservations} />
        </TabsContent>

        <TabsContent value="settings">
          <PropertySettingsForm property={property} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

import { PropertySettingsForm } from "@/components/property-settings-form";
