import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * Debug endpoint: returns raw Guesty payloads for a few reservations
 * so we can verify which fields are actually present.
 *
 * GET /api/debug/reservations?limit=3
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(Number(searchParams.get("limit") || "3"), 10);

  const reservations = await prisma.reservation.findMany({
    take: limit,
    orderBy: { checkIn: "desc" },
    select: {
      id: true,
      guestyReservationId: true,
      guestName: true,
      payoutAmount: true,
      rawPayload: true,
    },
  });

  // Parse rawPayload so the JSON is readable
  const results = reservations.map((r) => ({
    id: r.id,
    guestyReservationId: r.guestyReservationId,
    storedGuestName: r.guestName,
    storedPayout: r.payoutAmount,
    rawFromGuesty: r.rawPayload ? JSON.parse(r.rawPayload) : null,
  }));

  return NextResponse.json({ results });
}
