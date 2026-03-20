/**
 * Expense estimation engine.
 *
 * Calculates operating expenses for a property in a given period.
 * Supports both estimated values (from property defaults) and manual overrides.
 *
 * Estimation rules:
 * - Housekeeping: stays_booked * cost_per_stay
 * - Laundry: stays_booked * cost_per_stay
 * - Electricity: nights_booked * cost_per_night
 * - Water: nights_booked * cost_per_night
 * - Gas: nights_booked * cost_per_night
 * - Internet: fixed monthly amount (prorated for partial months)
 * - HOA: fixed monthly amount (prorated for partial months)
 */

import {
  differenceInDays,
  getDaysInMonth,
  startOfMonth,
  endOfMonth,
  max as dateMax,
  min as dateMin,
} from "date-fns";
import type {
  DateRange,
  ExpenseBreakdown,
  PropertyExpenseDefaults,
  PeriodOverrides,
} from "@/lib/types";

/**
 * Calculate the proration factor for fixed monthly costs across a date range.
 *
 * For a custom date range that spans partial months, we calculate
 * what fraction of each month is covered and sum them.
 * For a full single month, this returns 1.0.
 */
export function calculateProrationFactor(range: DateRange): number {
  const start = range.start;
  const end = range.end;

  let totalFactor = 0;
  let current = startOfMonth(start);

  while (current <= end) {
    const monthStart = startOfMonth(current);
    const monthEnd = endOfMonth(current);
    const daysInMonth = getDaysInMonth(current);

    // Clamp to the actual range
    const effectiveStart = dateMax([monthStart, start]);
    const effectiveEnd = dateMin([monthEnd, end]);

    if (effectiveStart <= effectiveEnd) {
      // +1 because both start and end days are inclusive
      const coveredDays = differenceInDays(effectiveEnd, effectiveStart) + 1;
      totalFactor += coveredDays / daysInMonth;
    }

    // Move to next month
    const nextMonth = new Date(current);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    current = startOfMonth(nextMonth);
  }

  return totalFactor;
}

/**
 * Calculate the full expense breakdown for a property in a period.
 *
 * Priority: if a manual override exists for a category, use it.
 * Otherwise, use the estimated value from defaults.
 */
export function calculateExpenses(
  defaults: PropertyExpenseDefaults,
  nightsBooked: number,
  staysBooked: number,
  period: DateRange,
  overrides: PeriodOverrides
): ExpenseBreakdown {
  const prorationFactor = calculateProrationFactor(period);

  // Estimated values
  const estHousekeeping = staysBooked * defaults.defaultHousekeepingPerStay;
  const estLaundry = staysBooked * defaults.defaultLaundryPerStay;
  const estElectricity = nightsBooked * defaults.defaultElectricityPerNight;
  const estWater = nightsBooked * defaults.defaultWaterPerNight;
  const estGas = nightsBooked * defaults.defaultGasPerNight;
  // Fixed monthly costs are prorated for custom date ranges
  const estInternet = defaults.internetMonthly * prorationFactor;
  const estHoa = defaults.hoaMonthly * prorationFactor;
  const estPmsSoftware = defaults.pmsSoftwareMonthly * prorationFactor;
  const estAutorank = defaults.autorankMonthly * prorationFactor;
  const estRmsSoftware = defaults.rmsSoftwareMonthly * prorationFactor;
  const estMessagingSoftware = defaults.messagingSoftwareMonthly * prorationFactor;

  return {
    housekeeping: {
      estimated: round2(estHousekeeping),
      override: overrides.housekeepingOverride,
      final: round2(overrides.housekeepingOverride ?? estHousekeeping),
    },
    laundry: {
      estimated: round2(estLaundry),
      override: overrides.laundryOverride,
      final: round2(overrides.laundryOverride ?? estLaundry),
    },
    electricity: {
      estimated: round2(estElectricity),
      override: overrides.electricityOverride,
      final: round2(overrides.electricityOverride ?? estElectricity),
    },
    water: {
      estimated: round2(estWater),
      override: overrides.waterOverride,
      final: round2(overrides.waterOverride ?? estWater),
    },
    gas: {
      estimated: round2(estGas),
      override: overrides.gasOverride,
      final: round2(overrides.gasOverride ?? estGas),
    },
    internet: {
      estimated: round2(estInternet),
      override: overrides.internetOverride,
      final: round2(overrides.internetOverride ?? estInternet),
    },
    hoa: {
      estimated: round2(estHoa),
      override: overrides.hoaOverride,
      final: round2(overrides.hoaOverride ?? estHoa),
    },
    pmsSoftware: {
      estimated: round2(estPmsSoftware),
      override: overrides.pmsSoftwareOverride,
      final: round2(overrides.pmsSoftwareOverride ?? estPmsSoftware),
    },
    autorank: {
      estimated: round2(estAutorank),
      override: overrides.autorankOverride,
      final: round2(overrides.autorankOverride ?? estAutorank),
    },
    rmsSoftware: {
      estimated: round2(estRmsSoftware),
      override: overrides.rmsSoftwareOverride,
      final: round2(overrides.rmsSoftwareOverride ?? estRmsSoftware),
    },
    messagingSoftware: {
      estimated: round2(estMessagingSoftware),
      override: overrides.messagingSoftwareOverride,
      final: round2(overrides.messagingSoftwareOverride ?? estMessagingSoftware),
    },
  };
}

/** Sum all final expense values */
export function totalExpenses(expenses: ExpenseBreakdown): number {
  return round2(
    expenses.housekeeping.final +
      expenses.laundry.final +
      expenses.electricity.final +
      expenses.water.final +
      expenses.gas.final +
      expenses.internet.final +
      expenses.hoa.final +
      expenses.pmsSoftware.final +
      expenses.autorank.final +
      expenses.rmsSoftware.final +
      expenses.messagingSoftware.final
  );
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
