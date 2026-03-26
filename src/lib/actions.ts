"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { startOfMonth, endOfMonth } from "date-fns";

// ─── Types for bulk operations ───

export interface BulkDefaultsRow {
  propertyId: string;
  defaultHousekeepingPerStay: number;
  defaultLaundryPerStay: number;
  defaultElectricityPerNight: number;
  defaultWaterPerNight: number;
  defaultGasPerNight: number;
  internetMonthly: number;
  hoaMonthly: number;
  pmsSoftwareMonthly: number;
  autorankMonthly: number;
  rmsSoftwareMonthly: number;
  messagingSoftwareMonthly: number;
}

export interface BulkOverridesRow {
  propertyId: string;
  housekeepingOverride: number | null;
  laundryOverride: number | null;
  electricityOverride: number | null;
  waterOverride: number | null;
  gasOverride: number | null;
  internetOverride: number | null;
  hoaOverride: number | null;
  pmsSoftwareOverride: number | null;
  autorankOverride: number | null;
  rmsSoftwareOverride: number | null;
  messagingSoftwareOverride: number | null;
}

/**
 * Update property settings (business model, commission rate, expense defaults, etc.)
 */
export async function updateProperty(
  propertyId: string,
  data: {
    nickname?: string;
    businessModel?: string;
    commissionRate?: number | null;
    fixedOwnerPayoutMonthly?: number | null;
    internetMonthly?: number;
    hoaMonthly?: number;
    defaultElectricityPerNight?: number;
    defaultWaterPerNight?: number;
    defaultGasPerNight?: number;
    defaultHousekeepingPerStay?: number;
    defaultLaundryPerStay?: number;
    pmsSoftwareMonthly?: number;
    autorankMonthly?: number;
    rmsSoftwareMonthly?: number;
    messagingSoftwareMonthly?: number;
    notes?: string;
    active?: boolean;
  }
) {
  await prisma.property.update({
    where: { id: propertyId },
    data,
  });
  revalidatePath(`/properties/${propertyId}`);
  revalidatePath("/properties");
  revalidatePath("/dashboard");
}

/**
 * Save expense overrides for a property and month.
 * Creates or updates the override record.
 */
export async function saveExpenseOverrides(
  propertyId: string,
  monthKey: string,
  overrides: {
    electricityOverride?: number | null;
    waterOverride?: number | null;
    gasOverride?: number | null;
    internetOverride?: number | null;
    hoaOverride?: number | null;
    housekeepingOverride?: number | null;
    laundryOverride?: number | null;
    pmsSoftwareOverride?: number | null;
    autorankOverride?: number | null;
    rmsSoftwareOverride?: number | null;
    messagingSoftwareOverride?: number | null;
    notes?: string;
  }
) {
  const [year, month] = monthKey.split("-").map(Number);
  const periodStart = startOfMonth(new Date(year, month - 1));
  const periodEnd = endOfMonth(new Date(year, month - 1));

  await prisma.financialPeriodOverride.upsert({
    where: {
      propertyId_monthKey: {
        propertyId,
        monthKey,
      },
    },
    create: {
      propertyId,
      monthKey,
      periodStart,
      periodEnd,
      ...overrides,
    },
    update: overrides,
  });

  revalidatePath(`/properties/${propertyId}`);
  revalidatePath("/dashboard");
}

/**
 * Reset a specific expense override back to estimated value.
 */
export async function resetExpenseOverride(
  propertyId: string,
  monthKey: string,
  category: string
) {
  const override = await prisma.financialPeriodOverride.findUnique({
    where: {
      propertyId_monthKey: {
        propertyId,
        monthKey,
      },
    },
  });

  if (override) {
    await prisma.financialPeriodOverride.update({
      where: { id: override.id },
      data: { [`${category}Override`]: null },
    });
  }

  revalidatePath(`/properties/${propertyId}`);
  revalidatePath("/dashboard");
}

/**
 * Bulk update expense defaults (estimated costs) across multiple properties.
 */
export async function bulkSaveExpenseDefaults(rows: BulkDefaultsRow[]) {
  for (const row of rows) {
    const { propertyId, ...defaults } = row;
    await prisma.property.update({
      where: { id: propertyId },
      data: defaults,
    });
  }

  revalidatePath("/properties");
  revalidatePath("/dashboard");
  revalidatePath("/settings/bulk-edit");
}

/**
 * Bulk update expense overrides (actual costs) across multiple properties for a month.
 */
export async function bulkSaveExpenseOverrides(
  monthKey: string,
  rows: BulkOverridesRow[]
) {
  const [year, month] = monthKey.split("-").map(Number);
  const periodStart = startOfMonth(new Date(year, month - 1));
  const periodEnd = endOfMonth(new Date(year, month - 1));

  for (const row of rows) {
    const { propertyId, ...overrides } = row;
    await prisma.financialPeriodOverride.upsert({
      where: {
        propertyId_monthKey: { propertyId, monthKey },
      },
      create: {
        propertyId,
        monthKey,
        periodStart,
        periodEnd,
        ...overrides,
      },
      update: overrides,
    });
  }

  revalidatePath("/properties");
  revalidatePath("/dashboard");
  revalidatePath("/settings/bulk-edit");
}
