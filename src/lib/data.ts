/**
 * Data access layer.
 *
 * All database queries are centralized here to keep server actions
 * and API routes thin. Returns typed data for the calculation engine.
 */

import { prisma } from "@/lib/db";
import { format } from "date-fns";
import type {
  BusinessModel,
  DateRange,
  PeriodReservationSummary,
  PeriodOverrides,
  PropertyExpenseDefaults,
  PropertyFinancialSummary,
  DashboardSummary,
} from "@/lib/types";
import {
  calculateExpenses,
  calculatePropertyFinancials,
} from "@/lib/calculations";

/**
 * Get all active properties with their financials for a date range.
 */
export async function getDashboardData(
  period: DateRange
): Promise<DashboardSummary> {
  const properties = await prisma.property.findMany({
    where: { active: true },
    orderBy: { nickname: "asc" },
  });

  const summaries: PropertyFinancialSummary[] = [];

  for (const prop of properties) {
    const summary = await getPropertyFinancials(prop.id, period);
    summaries.push(summary);
  }

  const totalGrossPayout = summaries.reduce((s, p) => s + p.grossPayout, 0);
  const totalDelmarRevenue = summaries.reduce((s, p) => s + p.delmarRevenue, 0);
  const totalOperatingExpenses = summaries.reduce(
    (s, p) => s + p.totalOperatingExpenses,
    0
  );
  const totalUtilityMargin = summaries.reduce(
    (s, p) => s + p.netUtilityMargin,
    0
  );
  const validMargins = summaries.filter(
    (p) => p.utilityMarginPercentGross !== null
  );
  const averageUtilityMarginPercent =
    validMargins.length > 0
      ? Math.round(
          (validMargins.reduce(
            (s, p) => s + (p.utilityMarginPercentGross ?? 0),
            0
          ) /
            validMargins.length) *
            100
        ) / 100
      : null;

  return {
    totalGrossPayout: Math.round(totalGrossPayout * 100) / 100,
    totalDelmarRevenue: Math.round(totalDelmarRevenue * 100) / 100,
    totalOperatingExpenses: Math.round(totalOperatingExpenses * 100) / 100,
    totalUtilityMargin: Math.round(totalUtilityMargin * 100) / 100,
    averageUtilityMarginPercent,
    propertyCount: summaries.length,
    properties: summaries,
  };
}

/**
 * Get full financial summary for a single property in a period.
 */
export async function getPropertyFinancials(
  propertyId: string,
  period: DateRange
): Promise<PropertyFinancialSummary> {
  const property = await prisma.property.findUniqueOrThrow({
    where: { id: propertyId },
  });

  const reservationSummary = await getReservationSummary(propertyId, period);
  const overrides = await getOverrides(propertyId, period);
  const defaults = extractDefaults(property);
  const expenses = calculateExpenses(
    defaults,
    reservationSummary.nightsBooked,
    reservationSummary.staysBooked,
    period,
    overrides
  );

  return calculatePropertyFinancials({
    propertyId: property.id,
    propertyNickname: property.nickname,
    businessModel: property.businessModel as BusinessModel,
    commissionRate: property.commissionRate,
    fixedOwnerPayoutMonthly: property.fixedOwnerPayoutMonthly,
    period,
    reservationSummary,
    expenses,
  });
}

/**
 * Aggregate reservation data for a property in a date range.
 * Considers reservations where checkOut falls within the period.
 */
async function getReservationSummary(
  propertyId: string,
  period: DateRange
): Promise<PeriodReservationSummary> {
  const reservations = await prisma.reservation.findMany({
    where: {
      propertyId,
      // Include reservations that overlap with the period
      checkOut: { gte: period.start },
      checkIn: { lte: period.end },
      status: { not: "canceled" },
    },
  });

  return {
    totalReservations: reservations.length,
    nightsBooked: reservations.reduce((s, r) => s + r.nightsBooked, 0),
    staysBooked: reservations.reduce((s, r) => s + r.staysBooked, 0),
    grossPayout: reservations.reduce((s, r) => s + r.payoutAmount, 0),
    actualOwnerPayout: reservations.some((r) => r.ownerPayoutAmount !== null)
      ? reservations.reduce((s, r) => s + (r.ownerPayoutAmount ?? 0), 0)
      : null,
  };
}

/**
 * Get expense overrides for a property and period.
 * Tries exact monthKey match first, then falls back to overlapping period.
 */
async function getOverrides(
  propertyId: string,
  period: DateRange
): Promise<PeriodOverrides> {
  const monthKey = format(period.start, "yyyy-MM");

  const override = await prisma.financialPeriodOverride.findFirst({
    where: {
      propertyId,
      OR: [
        { monthKey },
        {
          periodStart: { lte: period.end },
          periodEnd: { gte: period.start },
        },
      ],
    },
    orderBy: { createdAt: "desc" },
  });

  if (!override) {
    return {
      housekeepingOverride: null,
      laundryOverride: null,
      electricityOverride: null,
      waterOverride: null,
      gasOverride: null,
      internetOverride: null,
      hoaOverride: null,
      pmsSoftwareOverride: null,
      autorankOverride: null,
      rmsSoftwareOverride: null,
      messagingSoftwareOverride: null,
    };
  }

  return {
    housekeepingOverride: override.housekeepingOverride,
    laundryOverride: override.laundryOverride,
    electricityOverride: override.electricityOverride,
    waterOverride: override.waterOverride,
    gasOverride: override.gasOverride,
    internetOverride: override.internetOverride,
    hoaOverride: override.hoaOverride,
    pmsSoftwareOverride: override.pmsSoftwareOverride,
    autorankOverride: override.autorankOverride,
    rmsSoftwareOverride: override.rmsSoftwareOverride,
    messagingSoftwareOverride: override.messagingSoftwareOverride,
  };
}

function extractDefaults(property: {
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
}): PropertyExpenseDefaults {
  return {
    defaultHousekeepingPerStay: property.defaultHousekeepingPerStay,
    defaultLaundryPerStay: property.defaultLaundryPerStay,
    defaultElectricityPerNight: property.defaultElectricityPerNight,
    defaultWaterPerNight: property.defaultWaterPerNight,
    defaultGasPerNight: property.defaultGasPerNight,
    internetMonthly: property.internetMonthly,
    hoaMonthly: property.hoaMonthly,
    pmsSoftwareMonthly: property.pmsSoftwareMonthly,
    autorankMonthly: property.autorankMonthly,
    rmsSoftwareMonthly: property.rmsSoftwareMonthly,
    messagingSoftwareMonthly: property.messagingSoftwareMonthly,
  };
}

/**
 * Get all properties (for lists, selects, etc.)
 */
export async function getAllProperties() {
  return prisma.property.findMany({
    where: { active: true },
    orderBy: { nickname: "asc" },
  });
}

/**
 * Get a single property by ID with all related data.
 */
export async function getPropertyById(id: string) {
  return prisma.property.findUniqueOrThrow({
    where: { id },
  });
}

/**
 * Get reservations for a property in a period.
 */
export async function getPropertyReservations(
  propertyId: string,
  period: DateRange
) {
  return prisma.reservation.findMany({
    where: {
      propertyId,
      checkOut: { gte: period.start },
      checkIn: { lte: period.end },
    },
    orderBy: { checkIn: "desc" },
  });
}

/**
 * Get sync job history.
 */
export async function getSyncJobs(limit = 20) {
  return prisma.syncJob.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}
