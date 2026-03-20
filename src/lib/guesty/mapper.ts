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
    // Primary payout field — try multiple Guesty money fields
    payoutAmount:
      raw.money?.hostPayout ??
      raw.money?.totalPaid ??
      raw.money?.fareAccommodation ??
      raw.money?.netIncome ??
      raw.money?.subTotalPrice ??
      0,
    // Owner revenue — may or may not be present
    ownerPayoutAmount: raw.money?.ownerRevenue ?? null,
    source: raw.source || null,
    rawPayload: JSON.stringify(raw),
  };
}
