import { prisma } from "@/lib/db";
import { BulkExpenseEditor } from "@/components/bulk-expense-editor";
import { format } from "date-fns";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function BulkEditPage() {
  const now = new Date();
  const monthKey = format(now, "yyyy-MM");

  const properties = await prisma.property.findMany({
    where: { active: true },
    orderBy: { nickname: "asc" },
    select: {
      id: true,
      nickname: true,
      businessModel: true,
      commissionRate: true,
      fixedOwnerPayoutMonthly: true,
      defaultHousekeepingPerStay: true,
      defaultLaundryPerStay: true,
      defaultElectricityPerNight: true,
      defaultWaterPerNight: true,
      defaultGasPerNight: true,
      internetMonthly: true,
      hoaMonthly: true,
      pmsSoftwareMonthly: true,
      autorankMonthly: true,
      rmsSoftwareMonthly: true,
      messagingSoftwareMonthly: true,
    },
  });

  // Load existing overrides for the current month
  const overrides = await prisma.financialPeriodOverride.findMany({
    where: {
      monthKey,
      propertyId: { in: properties.map((p) => p.id) },
    },
    select: {
      propertyId: true,
      housekeepingOverride: true,
      laundryOverride: true,
      electricityOverride: true,
      waterOverride: true,
      gasOverride: true,
      internetOverride: true,
      hoaOverride: true,
      pmsSoftwareOverride: true,
      autorankOverride: true,
      rmsSoftwareOverride: true,
      messagingSoftwareOverride: true,
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/settings">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Settings
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bulk Edit Expenses</h1>
          <p className="text-muted-foreground">
            Edit estimated defaults or actual overrides for all properties at once
          </p>
        </div>
      </div>

      <BulkExpenseEditor
        properties={properties}
        existingOverrides={overrides}
        monthKey={monthKey}
      />
    </div>
  );
}
