/**
 * Guesty sync orchestrator.
 *
 * Handles idempotent sync of listings and reservations from Guesty
 * into the local database. Logs sync jobs for audit.
 */

import { prisma } from "@/lib/db";
import { fetchAllListings, fetchReservations } from "./client";
import { mapListing, mapReservation } from "./mapper";

export interface SyncResult {
  syncJobId: string;
  status: "completed" | "failed";
  recordsProcessed: number;
  error?: string;
}

/**
 * Sync listings from Guesty.
 * Upserts on guestyListingId to avoid duplicates.
 */
export async function syncListings(): Promise<SyncResult> {
  const job = await prisma.syncJob.create({
    data: {
      source: "guesty",
      syncType: "listings",
      status: "running",
      startedAt: new Date(),
    },
  });

  try {
    const rawListings = await fetchAllListings();
    let processed = 0;

    for (const raw of rawListings) {
      const mapped = mapListing(raw);
      await prisma.property.upsert({
        where: { guestyListingId: mapped.guestyListingId },
        create: {
          guestyListingId: mapped.guestyListingId,
          nickname: mapped.nickname,
          title: mapped.title,
          active: mapped.active,
        },
        update: {
          nickname: mapped.nickname,
          title: mapped.title,
          active: mapped.active,
        },
      });
      processed++;
    }

    await prisma.syncJob.update({
      where: { id: job.id },
      data: {
        status: "completed",
        finishedAt: new Date(),
        recordsProcessed: processed,
      },
    });

    return { syncJobId: job.id, status: "completed", recordsProcessed: processed };
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    await prisma.syncJob.update({
      where: { id: job.id },
      data: {
        status: "failed",
        finishedAt: new Date(),
        errorLog: errMsg,
      },
    });
    return { syncJobId: job.id, status: "failed", recordsProcessed: 0, error: errMsg };
  }
}

/**
 * Sync reservations from Guesty for a date range.
 * Upserts on guestyReservationId to avoid duplicates.
 */
export async function syncReservations(
  from: string,
  to: string
): Promise<SyncResult> {
  const job = await prisma.syncJob.create({
    data: {
      source: "guesty",
      syncType: "reservations",
      status: "running",
      startedAt: new Date(),
    },
  });

  try {
    const rawReservations = await fetchReservations(from, to);
    let processed = 0;

    for (const raw of rawReservations) {
      const mapped = mapReservation(raw);

      // Skip reservations with no listing ID (e.g. inquiries, cancelled without listing)
      if (!mapped.guestyListingId) {
        continue;
      }

      // Find the property by guesty listing ID
      const property = await prisma.property.findUnique({
        where: { guestyListingId: mapped.guestyListingId },
      });

      if (!property) {
        // Skip reservations for unknown properties
        continue;
      }

      await prisma.reservation.upsert({
        where: { guestyReservationId: mapped.guestyReservationId },
        create: {
          guestyReservationId: mapped.guestyReservationId,
          propertyId: property.id,
          guestName: mapped.guestName,
          checkIn: mapped.checkIn,
          checkOut: mapped.checkOut,
          nightsBooked: mapped.nightsBooked,
          staysBooked: mapped.staysBooked,
          bookingDate: mapped.bookingDate,
          status: mapped.status,
          payoutAmount: mapped.payoutAmount,
          ownerPayoutAmount: mapped.ownerPayoutAmount,
          source: mapped.source,
          rawPayload: mapped.rawPayload,
        },
        update: {
          guestName: mapped.guestName,
          checkIn: mapped.checkIn,
          checkOut: mapped.checkOut,
          nightsBooked: mapped.nightsBooked,
          staysBooked: mapped.staysBooked,
          bookingDate: mapped.bookingDate,
          status: mapped.status,
          payoutAmount: mapped.payoutAmount,
          ownerPayoutAmount: mapped.ownerPayoutAmount,
          source: mapped.source,
          rawPayload: mapped.rawPayload,
        },
      });
      processed++;
    }

    await prisma.syncJob.update({
      where: { id: job.id },
      data: {
        status: "completed",
        finishedAt: new Date(),
        recordsProcessed: processed,
      },
    });

    return { syncJobId: job.id, status: "completed", recordsProcessed: processed };
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    await prisma.syncJob.update({
      where: { id: job.id },
      data: {
        status: "failed",
        finishedAt: new Date(),
        errorLog: errMsg,
      },
    });
    return { syncJobId: job.id, status: "failed", recordsProcessed: 0, error: errMsg };
  }
}
