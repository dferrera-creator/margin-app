"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { startOfMonth, endOfMonth } from "date-fns";

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
