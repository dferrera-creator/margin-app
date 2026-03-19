/**
 * Core business types for the Delmar Margin App.
 * These types are used across the calculation engine, API, and UI layers.
 */

export type BusinessModel = "commission" | "master_lease";

export interface DateRange {
  start: Date;
  end: Date;
}

/** Summary of reservation activity for a property in a period */
export interface PeriodReservationSummary {
  totalReservations: number;
  nightsBooked: number;
  staysBooked: number;
  grossPayout: number;
  /** Actual owner payout from imported data (may be null) */
  actualOwnerPayout: number | null;
}

/** Per-category expense breakdown */
export interface ExpenseBreakdown {
  housekeeping: { estimated: number; override: number | null; final: number };
  laundry: { estimated: number; override: number | null; final: number };
  electricity: { estimated: number; override: number | null; final: number };
  water: { estimated: number; override: number | null; final: number };
  gas: { estimated: number; override: number | null; final: number };
  internet: { estimated: number; override: number | null; final: number };
  hoa: { estimated: number; override: number | null; final: number };
}

/** Full financial summary for a property in a period */
export interface PropertyFinancialSummary {
  propertyId: string;
  propertyNickname: string;
  businessModel: BusinessModel;
  period: DateRange;
  // Reservation metrics
  totalReservations: number;
  nightsBooked: number;
  staysBooked: number;
  // Revenue
  grossPayout: number;
  ownerPayout: number;
  delmarRevenue: number;
  // Expenses
  expenses: ExpenseBreakdown;
  totalOperatingExpenses: number;
  // Margins
  netUtilityMargin: number;
  /** Margin as % of gross payout */
  utilityMarginPercentGross: number | null;
  /** Margin as % of Delmar revenue */
  utilityMarginPercentDelmar: number | null;
}

/** Property defaults used for expense estimation */
export interface PropertyExpenseDefaults {
  defaultHousekeepingPerStay: number;
  defaultLaundryPerStay: number;
  defaultElectricityPerNight: number;
  defaultWaterPerNight: number;
  defaultGasPerNight: number;
  internetMonthly: number;
  hoaMonthly: number;
}

/** Override values for a period (null = use estimate) */
export interface PeriodOverrides {
  housekeepingOverride: number | null;
  laundryOverride: number | null;
  electricityOverride: number | null;
  waterOverride: number | null;
  gasOverride: number | null;
  internetOverride: number | null;
  hoaOverride: number | null;
}

/** Dashboard-level aggregated summary */
export interface DashboardSummary {
  totalGrossPayout: number;
  totalDelmarRevenue: number;
  totalOperatingExpenses: number;
  totalUtilityMargin: number;
  averageUtilityMarginPercent: number | null;
  propertyCount: number;
  properties: PropertyFinancialSummary[];
}
