import { differenceInDays } from "date-fns";
import type { DateRange, RevenuePotential } from "@/lib/types";

const Z_90 = 1.645; // z-score for 90% two-sided CI

/**
 * Estimate the gross revenue potential from nights not yet (or never) booked.
 *
 * Uses a binomial model: each available night is independently booked with
 * probability `occupancyRate`. A normal approximation gives the 90% CI.
 *
 * Returns null when ADR cannot be computed (no booked nights or no revenue).
 */
export function calculateRevenuePotential(
  nightsBooked: number,
  grossPayout: number,
  period: DateRange,
  occupancyRate: number
): RevenuePotential | null {
  if (nightsBooked <= 0 || grossPayout <= 0) return null;

  const totalDays = differenceInDays(period.end, period.start) + 1;
  const availableNights = Math.max(0, totalDays - nightsBooked);
  const avgNightlyRate = grossPayout / nightsBooked;

  if (availableNights === 0) {
    return { availableNights: 0, avgNightlyRate, occupancyRate, low: 0, mid: 0, high: 0 };
  }

  const p = Math.min(1, Math.max(0, occupancyRate));
  const mean = availableNights * p;
  const sd = Math.sqrt(availableNights * p * (1 - p));

  const lowNights = Math.max(0, mean - Z_90 * sd);
  const highNights = Math.min(availableNights, mean + Z_90 * sd);

  return {
    availableNights,
    avgNightlyRate: round2(avgNightlyRate),
    occupancyRate: round2(p),
    low: round2(lowNights * avgNightlyRate),
    mid: round2(mean * avgNightlyRate),
    high: round2(highNights * avgNightlyRate),
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
