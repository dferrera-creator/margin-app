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
  pmsSoftware: { estimated: number; override: number | null; final: number };
  autorank: { estimated: number; override: number | null; final: number };
  rmsSoftware: { estimated: number; override: number | null; final: number };
  messagingSoftware: { estimated: number; override: number | null; final: number };
}

/** Full financial summary for a property in a period */
export interface PropertyFinancialSummary {
  propertyId: string;
  propertyNickname: string;
  businessModel: BusinessModel;
  active: boolean;
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
  /** 90% CI for revenue from remaining available nights */
  revenuePotential: RevenuePotential | null;
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
  pmsSoftwareMonthly: number;
  autorankMonthly: number;
  rmsSoftwareMonthly: number;
  messagingSoftwareMonthly: number;
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
  pmsSoftwareOverride: number | null;
  autorankOverride: number | null;
  rmsSoftwareOverride: number | null;
  messagingSoftwareOverride: number | null;
}

/** 90% Confidence Interval for unrealized gross revenue from available nights */
export interface RevenuePotential {
  availableNights: number;
  avgNightlyRate: number;
  occupancyRate: number;
  low: number;
  mid: number;
  high: number;
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

/** KPI snapshot for a single month */
export interface MonthKPI {
  monthKey: string; // "2026-03"
  grossPayout: number;
  delmarRevenue: number;
  totalOperatingExpenses: number;
  netUtilityMargin: number;
}

/** Multi-month trend data for the dashboard */
export interface DashboardTrendData {
  /** Current period aggregated summary */
  current: DashboardSummary;
  /** Previous comparison period summary (for delta calculation) */
  comparison: DashboardSummary | null;
  /** Monthly KPIs for sparklines (last N months) */
  monthlyKPIs: MonthKPI[];
  /** Per-property monthly trends */
  propertyTrends: PropertyTrend[];
}

/** Per-property trend across months */
export interface PropertyTrend {
  propertyId: string;
  propertyNickname: string;
  businessModel: BusinessModel;
  months: {
    monthKey: string;
    grossPayout: number;
    delmarRevenue: number;
    totalOperatingExpenses: number;
    netUtilityMargin: number;
    utilityMarginPercentGross: number | null;
  }[];
}
