/**
 * Guesty data mapper.
 *
 * Maps raw Guesty API responses to our internal data model.
 * If Guesty field names change, update ONLY this file.
 *
 * FLAG: Guesty financial fields vary by integration version:
 * - money.hostPayout — the amount paid to the host (most common)
 * - money.ownerRevenue — sometimes used for owner payout
 * - money.totalPaid — guest total
 * - money.fareAccommodation — accommodation revenue
 *
 * Adjust the mapping below to match your Guesty account's field structure.
 */

import type { GuestyListing, GuestyReservation } from "./client";

export interface MappedListing {
  guestyListingId: string;
  nickname: string;
  title: string | null;
  active: boolean;
}

export interface MappedReservation {
  guestyReservationId: string;
  guestyListingId: string;
  guestName: string | null;
  checkIn: Date;
  checkOut: Date;
  nightsBooked: number;
  staysBooked: number;
  bookingDate: Date | null;
  status: string;
  /** Total payout for the reservation (host payout from Guesty) */
  payoutAmount: number;
  /** Owner payout if separately tracked in Guesty */
  ownerPayoutAmount: number | null;
  source: string | null;
  rawPayload: string;
}

export function mapListing(raw: GuestyListing): MappedListing {
  return {
    guestyListingId: raw._id,
    nickname: raw.nickname || raw.title || "Unnamed",
    title: raw.title || null,
    active: raw.active !== false,
  };
}

export function mapReservation(raw: GuestyReservation): MappedReservation {
  const checkIn = new Date(raw.checkIn || "");
  const checkOut = new Date(raw.checkOut || "");
  const nightsBooked =
    raw.nightsCount ||
    Math.max(
      1,
      Math.round(
        (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)
      )
    );

  // Extract payout from Guesty money object
  // Try known fields first, then fall back to scanning all numeric values
  const money = raw.money ?? {};
  const payoutAmount = extractPayout(money);

  return {
    guestyReservationId: raw._id,
    guestyListingId: raw.listingId || "",
    guestName: raw.guest?.fullName || raw.guestName || null,
    checkIn,
    checkOut,
    nightsBooked,
    staysBooked: 1, // Each reservation = 1 stay
    bookingDate: raw.bookedAt ? new Date(raw.bookedAt) : null,
    status: raw.status || "confirmed",
    payoutAmount,
    // Owner revenue — may or may not be present
    ownerPayoutAmount: raw.money?.ownerRevenue ?? null,
    source: raw.source || null,
    rawPayload: JSON.stringify(raw),
  };
}

/**
 * Extract payout from the Guesty money object.
 *
 * Priority order for known fields:
 * 1. hostPayout — most common in Guesty Open API
 * 2. totalPaid — guest total
 * 3. fareAccommodation — accommodation fare
 * 4. netIncome — net after channel fees
 * 5. subTotalPrice — subtotal
 *
 * If none of those are present and non-zero, scan all keys
 * for the first numeric value > 0 as a last resort.
 */
function extractPayout(money: Record<string, unknown>): number {
  const knownFields = [
    "hostPayout",
    "totalPaid",
    "fareAccommodation",
    "netIncome",
    "subTotalPrice",
    "balanceDue",
    "invoiceTotal",
  ];

  for (const field of knownFields) {
    const val = money[field];
    if (typeof val === "number" && val > 0) {
      return val;
    }
  }

  // Fallback: scan all keys for a positive number
  for (const [, val] of Object.entries(money)) {
    if (typeof val === "number" && val > 0) {
      return val;
    }
  }

  return 0;
}
