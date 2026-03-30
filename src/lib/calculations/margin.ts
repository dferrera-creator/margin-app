/**
 * Margin calculation engine.
 *
 * Implements the core utility margin formula:
 *   delmar_revenue = gross_payout - owner_payout
 *   net_utility_margin = delmar_revenue - total_operating_expenses
 *   utility_margin_% = net_utility_margin / gross_payout (or / delmar_revenue)
 *
 * Owner payout logic depends on business model:
 *   Commission: actual_owner_payout OR gross_payout * (1 - commission_rate)
 *   Master Lease: fixed_owner_payout_monthly (prorated for period)
 */

import type {
  BusinessModel,
  DateRange,
  PropertyFinancialSummary,
  PeriodReservationSummary,
  ExpenseBreakdown,
} from "@/lib/types";
import { totalExpenses, calculateProrationFactor } from "./expenses";

interface MarginCalcInput {
  propertyId: string;
  propertyNickname: string;
  businessModel: BusinessModel;
  active: boolean;
  commissionRate: number | null;
  fixedOwnerPayoutMonthly: number | null;
  period: DateRange;
  reservationSummary: PeriodReservationSummary;
  expenses: ExpenseBreakdown;
}

export function calculatePropertyFinancials(
  input: MarginCalcInput
): PropertyFinancialSummary {
  const { reservationSummary, businessModel, period, expenses } = input;
  const grossPayout = round2(reservationSummary.grossPayout);

  // Calculate owner payout based on business model
  const ownerPayout = round2(
    calculateOwnerPayout(
      businessModel,
      grossPayout,
      reservationSummary.actualOwnerPayout,
      input.commissionRate,
      input.fixedOwnerPayoutMonthly,
      period
    )
  );

  const delmarRevenue = round2(grossPayout - ownerPayout);
  const totalOpEx = totalExpenses(expenses);
  const netUtilityMargin = round2(delmarRevenue - totalOpEx);

  return {
    propertyId: input.propertyId,
    propertyNickname: input.propertyNickname,
    businessModel,
    active: input.active,
    period,
    totalReservations: reservationSummary.totalReservations,
    nightsBooked: reservationSummary.nightsBooked,
    staysBooked: reservationSummary.staysBooked,
    grossPayout,
    ownerPayout,
    delmarRevenue,
    expenses,
    totalOperatingExpenses: totalOpEx,
    netUtilityMargin,
    utilityMarginPercentGross:
      grossPayout > 0 ? round2((netUtilityMargin / grossPayout) * 100) : null,
    utilityMarginPercentDelmar:
      delmarRevenue > 0
        ? round2((netUtilityMargin / delmarRevenue) * 100)
        : null,
  };
}

/**
 * Calculate owner payout based on business model.
 *
 * Commission-based:
 *   Always derived from system settings: owner gets (1 - commission_rate) of gross.
 *   Guesty's ownerRevenue is ignored — the commission rate configured per property
 *   is the source of truth for commission-based units.
 *
 * Master Lease:
 *   Fixed monthly payout, prorated for the period
 */
function calculateOwnerPayout(
  businessModel: BusinessModel,
  grossPayout: number,
  _actualOwnerPayout: number | null,
  commissionRate: number | null,
  fixedOwnerPayoutMonthly: number | null,
  period: DateRange
): number {
  if (businessModel === "commission") {
    const rate = commissionRate ?? 0;
    // Delmar keeps rate%, owner gets (1 - rate%)
    return grossPayout * (1 - rate);
  }

  if (businessModel === "master_lease") {
    const monthlyPayout = fixedOwnerPayoutMonthly ?? 0;
    const prorationFactor = calculateProrationFactor(period);
    return monthlyPayout * prorationFactor;
  }

  return 0;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
