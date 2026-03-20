import { NextResponse } from "next/server";
import { syncListings, syncReservations } from "@/lib/guesty";
import { getSyncJobs } from "@/lib/data";
import { format, subMonths } from "date-fns";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type } = body;

    if (type === "listings") {
      const result = await syncListings();
      return NextResponse.json(result);
    }

    if (type === "reservations") {
      // Use provided date range, or default to last 1 month
      const from = body.from || format(subMonths(new Date(), 1), "yyyy-MM-dd");
      const to = body.to || format(new Date(), "yyyy-MM-dd");
      const result = await syncReservations(from, to);
      return NextResponse.json({ ...result, from, to });
    }

    return NextResponse.json({ error: "Invalid sync type" }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const jobs = await getSyncJobs();
    return NextResponse.json({ jobs });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
