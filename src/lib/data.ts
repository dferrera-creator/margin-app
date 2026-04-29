/**
 * Data access layer.
 *
 * All database queries are centralized here to keep server actions
 * and API routes thin. Returns typed data for the calculation engine.
 */

import { prisma } from "@/lib/db";
import { format, startOfMonth, endOfMonth, subMonths, differenceInDays } from "date-fns";
import type {
  BusinessModel,
  DateRange,
  PeriodReservationSummary,
  PeriodOverrides,
  PropertyExpenseDefaults,
  PropertyFinancialSummary,
  DashboardSummary,
  DashboardTrendData,
  MonthKPI,
  PropertyTrend,
} from "@/lib/types";
import {
  calculateExpenses,
  calculatePropertyFinancials,
  calculateRevenuePotential,
} from "@/lib/calculations";

/**
 * Get all active properties with their financials for a date range.
 */
export async function getDashboardData(
  period: DateRange,
  options?: { includeArchived?: boolean }
): Promise<DashboardSummary> {
  const properties = await prisma.property.findMany({
    where: options?.includeArchived ? {} : { active: true },
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

  const [reservationSummary, historicalOccupancyRate] = await Promise.all([
    getReservationSummary(propertyId, period),
    getHistoricalOccupancyRate(propertyId, period),
  ]);
  const overrides = await getOverrides(propertyId, period);
  const defaults = extractDefaults(property);
  const expenses = calculateExpenses(
    defaults,
    reservationSummary.nightsBooked,
    reservationSummary.staysBooked,
    period,
    overrides
  );

  const financials = calculatePropertyFinancials({
    propertyId: property.id,
    propertyNickname: property.nickname,
    businessModel: property.businessModel as BusinessModel,
    active: property.active,
    commissionRate: property.commissionRate,
    fixedOwnerPayoutMonthly: property.fixedOwnerPayoutMonthly,
    period,
    reservationSummary,
    expenses,
  });

  const revenuePotential = calculateRevenuePotential(
    reservationSummary.nightsBooked,
    reservationSummary.grossPayout,
    period,
    historicalOccupancyRate
  );

  return { ...financials, revenuePotential };
}

/**
 * Aggregate reservation data for a property in a date range.
 *
 * Prorates reservations that span period boundaries:
 * If a reservation goes from Feb 15 to Mar 3 (16 nights), and the period
 * is February, only the Feb 15-28 portion (14 nights) is counted.
 * Income is divided proportionally by nights (payout / total_nights * nights_in_period).
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
      status: "confirmed",
    },
  });

  let nightsBooked = 0;
  let staysBooked = 0;
  let grossPayout = 0;
  let ownerPayoutSum = 0;
  let hasOwnerPayout = false;

  for (const r of reservations) {
    const totalNights = r.nightsBooked || 1;

    // Clamp the reservation's stay to the period boundaries
    // checkIn is the first night, checkOut is the departure day (not a night)
    const effectiveStart = r.checkIn < period.start ? period.start : r.checkIn;
    const effectiveEnd = r.checkOut > period.end ? period.end : r.checkOut;

    // Nights in period = difference in days between effective start and effective end
    const msPerDay = 1000 * 60 * 60 * 24;
    const nightsInPeriod = Math.max(
      0,
      Math.round((effectiveEnd.getTime() - effectiveStart.getTime()) / msPerDay)
    );

    if (nightsInPeriod <= 0) continue;

    // Proration factor: what fraction of this reservation falls in the period
    const fraction = nightsInPeriod / totalNights;

    nightsBooked += nightsInPeriod;
    // Count a stay if the check-in falls within the period
    staysBooked += r.checkIn >= period.start && r.checkIn <= period.end ? 1 : 0;
    grossPayout += r.payoutAmount * fraction;

    if (r.ownerPayoutAmount !== null) {
      hasOwnerPayout = true;
      ownerPayoutSum += r.ownerPayoutAmount * fraction;
    }
  }

  return {
    totalReservations: reservations.length,
    nightsBooked,
    staysBooked,
    grossPayout,
    actualOwnerPayout: hasOwnerPayout ? ownerPayoutSum : null,
  };
}

/**
 * Compute average occupancy rate over the 6 months prior to the current period.
 * Returns nightsBooked / totalAvailableNights across that window.
 */
async function getHistoricalOccupancyRate(
  propertyId: string,
  period: DateRange
): Promise<number> {
  const windowStart = startOfMonth(subMonths(period.start, 6));
  const windowEnd = period.start;

  const reservations = await prisma.reservation.findMany({
    where: {
      propertyId,
      status: "confirmed",
      checkIn: { lt: windowEnd },
      checkOut: { gt: windowStart },
    },
    select: { checkIn: true, checkOut: true, nightsBooked: true },
  });

  let totalNightsBooked = 0;
  const msPerDay = 1000 * 60 * 60 * 24;

  for (const r of reservations) {
    const effectiveStart = r.checkIn < windowStart ? windowStart : r.checkIn;
    const effectiveEnd = r.checkOut > windowEnd ? windowEnd : r.checkOut;
    const nights = Math.max(
      0,
      Math.round((effectiveEnd.getTime() - effectiveStart.getTime()) / msPerDay)
    );
    totalNightsBooked += nights;
  }

  const totalAvailableDays = differenceInDays(windowEnd, windowStart);
  if (totalAvailableDays <= 0) return 0;

  return Math.min(1, totalNightsBooked / totalAvailableDays);
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
      status: { notIn: ["canceled", "inquiry"] },
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

/**
 * Build dashboard trend data: current period, comparison period,
 * monthly sparkline KPIs, and per-property monthly trends.
 */
export async function getDashboardTrendData(
  currentPeriod: DateRange,
  options?: {
    includeArchived?: boolean;
    propertyIds?: string[];
    comparisonMonthsBack?: number; // default 1 = previous month
    trendMonths?: number; // default 6
  }
): Promise<DashboardTrendData> {
  const compBack = options?.comparisonMonthsBack ?? 1;
  const trendMonths = options?.trendMonths ?? 6;

  // Comparison period: same-length period shifted back
  const compStart = subMonths(currentPeriod.start, compBack);
  const compEnd = endOfMonth(compStart);
  const comparisonPeriod: DateRange = {
    start: startOfMonth(compStart),
    end: compEnd,
  };

  // Build month ranges for sparkline
  const monthRanges: { monthKey: string; range: DateRange }[] = [];
  for (let i = trendMonths - 1; i >= 0; i--) {
    const d = subMonths(currentPeriod.start, i);
    monthRanges.push({
      monthKey: format(d, "yyyy-MM"),
      range: { start: startOfMonth(d), end: endOfMonth(d) },
    });
  }

  // Fetch current + comparison summaries
  const filterOpts = { includeArchived: options?.includeArchived };
  const [currentFull, comparisonFull] = await Promise.all([
    getDashboardData(currentPeriod, filterOpts),
    getDashboardData(comparisonPeriod, filterOpts),
  ]);

  // Filter to selected properties if specified
  const filterProps = (summary: DashboardSummary): DashboardSummary => {
    if (!options?.propertyIds || options.propertyIds.length === 0)
      return summary;
    const filtered = summary.properties.filter((p) =>
      options.propertyIds!.includes(p.propertyId)
    );
    return recomputeTotals(filtered);
  };

  const current = filterProps(currentFull);
  const comparison = filterProps(comparisonFull);

  // Build monthly KPIs for sparkline
  const monthlyKPIs: MonthKPI[] = [];
  // Property-level accumulator
  const propMonthMap: Record<string, PropertyTrend["months"]> = {};

  for (const { monthKey, range } of monthRanges) {
    const monthData = await getDashboardData(range, filterOpts);
    const filtered = filterProps(monthData);

    monthlyKPIs.push({
      monthKey,
      grossPayout: filtered.totalGrossPayout,
      delmarRevenue: filtered.totalDelmarRevenue,
      totalOperatingExpenses: filtered.totalOperatingExpenses,
      netUtilityMargin: filtered.totalUtilityMargin,
    });

    // Per-property trends
    for (const p of filtered.properties) {
      if (!propMonthMap[p.propertyId]) propMonthMap[p.propertyId] = [];
      propMonthMap[p.propertyId].push({
        monthKey,
        grossPayout: p.grossPayout,
        delmarRevenue: p.delmarRevenue,
        totalOperatingExpenses: p.totalOperatingExpenses,
        netUtilityMargin: p.netUtilityMargin,
        utilityMarginPercentGross: p.utilityMarginPercentGross,
      });
    }
  }

  const propertyTrends: PropertyTrend[] = current.properties.map((p) => ({
    propertyId: p.propertyId,
    propertyNickname: p.propertyNickname,
    businessModel: p.businessModel,
    months: propMonthMap[p.propertyId] || [],
  }));

  return {
    current,
    comparison,
    monthlyKPIs,
    propertyTrends,
  };
}

/** Recompute dashboard totals from a filtered property list */
function recomputeTotals(
  properties: PropertyFinancialSummary[]
): DashboardSummary {
  const totalGrossPayout = properties.reduce((s, p) => s + p.grossPayout, 0);
  const totalDelmarRevenue = properties.reduce(
    (s, p) => s + p.delmarRevenue,
    0
  );
  const totalOperatingExpenses = properties.reduce(
    (s, p) => s + p.totalOperatingExpenses,
    0
  );
  const totalUtilityMargin = properties.reduce(
    (s, p) => s + p.netUtilityMargin,
    0
  );
  const validMargins = properties.filter(
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
    propertyCount: properties.length,
    properties,
  };
}
