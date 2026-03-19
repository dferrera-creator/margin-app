/**
 * Seed script for Delmar Margin Dashboard.
 *
 * Creates:
 * - 1 commission-based property ("Beachfront Condo")
 * - 1 master lease property ("Downtown Loft")
 * - Realistic reservations across recent months
 * - Sample expense overrides
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Clear existing data
  await prisma.financialPeriodOverride.deleteMany();
  await prisma.reservation.deleteMany();
  await prisma.syncJob.deleteMany();
  await prisma.property.deleteMany();

  // ─── Property 1: Commission-based ───
  const beachfront = await prisma.property.create({
    data: {
      nickname: "Beachfront Condo",
      title: "Luxury Beachfront Condo - Ocean View",
      guestyListingId: "guesty_demo_001",
      active: true,
      businessModel: "commission",
      commissionRate: 0.2, // 20% commission
      defaultHousekeepingPerStay: 85,
      defaultLaundryPerStay: 25,
      defaultElectricityPerNight: 12,
      defaultWaterPerNight: 5,
      defaultGasPerNight: 3,
      internetMonthly: 75,
      hoaMonthly: 350,
      notes: "Premium beachfront property. High season: June-August.",
    },
  });

  // ─── Property 2: Master Lease ───
  const downtown = await prisma.property.create({
    data: {
      nickname: "Downtown Loft",
      title: "Modern Downtown Loft - City Center",
      guestyListingId: "guesty_demo_002",
      active: true,
      businessModel: "master_lease",
      fixedOwnerPayoutMonthly: 2500,
      defaultHousekeepingPerStay: 65,
      defaultLaundryPerStay: 20,
      defaultElectricityPerNight: 8,
      defaultWaterPerNight: 4,
      defaultGasPerNight: 2,
      internetMonthly: 60,
      hoaMonthly: 200,
      notes: "Master lease. Fixed $2,500/mo to owner.",
    },
  });

  // ─── Property 3: Commission-based, lower volume ───
  const mountain = await prisma.property.create({
    data: {
      nickname: "Mountain Retreat",
      title: "Cozy Mountain Cabin Retreat",
      guestyListingId: "guesty_demo_003",
      active: true,
      businessModel: "commission",
      commissionRate: 0.25, // 25% commission
      defaultHousekeepingPerStay: 95,
      defaultLaundryPerStay: 30,
      defaultElectricityPerNight: 15,
      defaultWaterPerNight: 6,
      defaultGasPerNight: 8, // Higher gas for heating
      internetMonthly: 80,
      hoaMonthly: 0,
      notes: "Mountain property. Seasonal demand peaks in winter and summer.",
    },
  });

  // ─── Property 4: Master Lease, urban ───
  const midtown = await prisma.property.create({
    data: {
      nickname: "Midtown Studio",
      title: "Midtown Studio Apartment",
      guestyListingId: "guesty_demo_004",
      active: true,
      businessModel: "master_lease",
      fixedOwnerPayoutMonthly: 1800,
      defaultHousekeepingPerStay: 50,
      defaultLaundryPerStay: 15,
      defaultElectricityPerNight: 6,
      defaultWaterPerNight: 3,
      defaultGasPerNight: 2,
      internetMonthly: 55,
      hoaMonthly: 150,
      notes: "Small studio. High turnover, low per-stay costs.",
    },
  });

  // ─── Reservations ───
  // Generate reservations for the last 3 months
  const now = new Date();
  const months = [
    new Date(now.getFullYear(), now.getMonth() - 2, 1),
    new Date(now.getFullYear(), now.getMonth() - 1, 1),
    new Date(now.getFullYear(), now.getMonth(), 1),
  ];

  // Beachfront Condo reservations (high revenue)
  const beachfrontReservations = [
    // 2 months ago
    { checkIn: addDays(months[0], 1), nights: 5, payout: 1850, guest: "John Smith", source: "Airbnb" },
    { checkIn: addDays(months[0], 8), nights: 3, payout: 1100, guest: "Sarah Johnson", source: "Booking.com" },
    { checkIn: addDays(months[0], 14), nights: 7, payout: 2600, guest: "Mike Chen", source: "Airbnb" },
    { checkIn: addDays(months[0], 23), nights: 4, payout: 1500, guest: "Emily Davis", source: "Direct" },
    // 1 month ago
    { checkIn: addDays(months[1], 2), nights: 6, payout: 2200, guest: "Robert Wilson", source: "Airbnb" },
    { checkIn: addDays(months[1], 10), nights: 4, payout: 1480, guest: "Lisa Anderson", source: "VRBO" },
    { checkIn: addDays(months[1], 16), nights: 3, payout: 1100, guest: "David Taylor", source: "Airbnb" },
    { checkIn: addDays(months[1], 21), nights: 5, payout: 1850, guest: "Jennifer Brown", source: "Booking.com" },
    { checkIn: addDays(months[1], 27), nights: 2, payout: 750, guest: "Chris Lee", source: "Direct" },
    // Current month
    { checkIn: addDays(months[2], 1), nights: 4, payout: 1500, guest: "Amanda White", source: "Airbnb" },
    { checkIn: addDays(months[2], 7), nights: 5, payout: 1850, guest: "James Harris", source: "Booking.com" },
    { checkIn: addDays(months[2], 14), nights: 3, payout: 1100, guest: "Maria Garcia", source: "Airbnb" },
  ];

  for (const r of beachfrontReservations) {
    await prisma.reservation.create({
      data: {
        propertyId: beachfront.id,
        guestName: r.guest,
        checkIn: r.checkIn,
        checkOut: addDays(r.checkIn, r.nights),
        nightsBooked: r.nights,
        staysBooked: 1,
        bookingDate: addDays(r.checkIn, -14),
        status: "confirmed",
        payoutAmount: r.payout,
        source: r.source,
      },
    });
  }

  // Downtown Loft reservations (steady, moderate revenue)
  const downtownReservations = [
    // 2 months ago
    { checkIn: addDays(months[0], 0), nights: 3, payout: 650, guest: "Tom Baker", source: "Airbnb" },
    { checkIn: addDays(months[0], 5), nights: 4, payout: 860, guest: "Nancy Clark", source: "Booking.com" },
    { checkIn: addDays(months[0], 12), nights: 2, payout: 430, guest: "Peter Wright", source: "Airbnb" },
    { checkIn: addDays(months[0], 17), nights: 5, payout: 1080, guest: "Sandra Hill", source: "Direct" },
    { checkIn: addDays(months[0], 24), nights: 4, payout: 860, guest: "Kevin Scott", source: "Airbnb" },
    // 1 month ago
    { checkIn: addDays(months[1], 1), nights: 3, payout: 650, guest: "Rachel Green", source: "VRBO" },
    { checkIn: addDays(months[1], 6), nights: 5, payout: 1080, guest: "Daniel King", source: "Airbnb" },
    { checkIn: addDays(months[1], 13), nights: 4, payout: 860, guest: "Laura Adams", source: "Booking.com" },
    { checkIn: addDays(months[1], 20), nights: 3, payout: 650, guest: "Steven Young", source: "Airbnb" },
    { checkIn: addDays(months[1], 25), nights: 4, payout: 860, guest: "Michelle Hall", source: "Direct" },
    // Current month
    { checkIn: addDays(months[2], 2), nights: 3, payout: 650, guest: "Brian Allen", source: "Airbnb" },
    { checkIn: addDays(months[2], 8), nights: 4, payout: 860, guest: "Karen Moore", source: "Booking.com" },
    { checkIn: addDays(months[2], 15), nights: 2, payout: 430, guest: "George Martin", source: "Airbnb" },
  ];

  for (const r of downtownReservations) {
    await prisma.reservation.create({
      data: {
        propertyId: downtown.id,
        guestName: r.guest,
        checkIn: r.checkIn,
        checkOut: addDays(r.checkIn, r.nights),
        nightsBooked: r.nights,
        staysBooked: 1,
        bookingDate: addDays(r.checkIn, -10),
        status: "confirmed",
        payoutAmount: r.payout,
        source: r.source,
      },
    });
  }

  // Mountain Retreat reservations (lower volume, higher per-night)
  const mountainReservations = [
    // 2 months ago
    { checkIn: addDays(months[0], 3), nights: 7, payout: 2450, guest: "Alex Turner", source: "Airbnb" },
    { checkIn: addDays(months[0], 15), nights: 4, payout: 1400, guest: "Olivia Martinez", source: "VRBO" },
    // 1 month ago
    { checkIn: addDays(months[1], 1), nights: 5, payout: 1750, guest: "Ryan Thompson", source: "Airbnb" },
    { checkIn: addDays(months[1], 10), nights: 3, payout: 1050, guest: "Sophie Robinson", source: "Direct" },
    { checkIn: addDays(months[1], 20), nights: 7, payout: 2450, guest: "Jake Williams", source: "Airbnb" },
    // Current month
    { checkIn: addDays(months[2], 5), nights: 4, payout: 1400, guest: "Emma Jackson", source: "Booking.com" },
    { checkIn: addDays(months[2], 12), nights: 3, payout: 1050, guest: "Noah Lewis", source: "Airbnb" },
  ];

  for (const r of mountainReservations) {
    await prisma.reservation.create({
      data: {
        propertyId: mountain.id,
        guestName: r.guest,
        checkIn: r.checkIn,
        checkOut: addDays(r.checkIn, r.nights),
        nightsBooked: r.nights,
        staysBooked: 1,
        bookingDate: addDays(r.checkIn, -21),
        status: "confirmed",
        payoutAmount: r.payout,
        source: r.source,
      },
    });
  }

  // Midtown Studio reservations (high turnover)
  const midtownReservations = [
    // 2 months ago
    { checkIn: addDays(months[0], 0), nights: 2, payout: 320, guest: "Liam Brown", source: "Airbnb" },
    { checkIn: addDays(months[0], 4), nights: 3, payout: 480, guest: "Ava Davis", source: "Booking.com" },
    { checkIn: addDays(months[0], 9), nights: 2, payout: 320, guest: "Mason Wilson", source: "Airbnb" },
    { checkIn: addDays(months[0], 13), nights: 4, payout: 640, guest: "Isabella Taylor", source: "VRBO" },
    { checkIn: addDays(months[0], 19), nights: 2, payout: 320, guest: "Ethan Anderson", source: "Airbnb" },
    { checkIn: addDays(months[0], 23), nights: 3, payout: 480, guest: "Mia Thomas", source: "Direct" },
    { checkIn: addDays(months[0], 28), nights: 2, payout: 320, guest: "Logan Harris", source: "Airbnb" },
    // 1 month ago
    { checkIn: addDays(months[1], 1), nights: 3, payout: 480, guest: "Charlotte Clark", source: "Airbnb" },
    { checkIn: addDays(months[1], 6), nights: 2, payout: 320, guest: "Aiden Lewis", source: "Booking.com" },
    { checkIn: addDays(months[1], 10), nights: 4, payout: 640, guest: "Harper Walker", source: "Airbnb" },
    { checkIn: addDays(months[1], 16), nights: 2, payout: 320, guest: "Elijah Hall", source: "VRBO" },
    { checkIn: addDays(months[1], 20), nights: 3, payout: 480, guest: "Amelia Allen", source: "Airbnb" },
    { checkIn: addDays(months[1], 25), nights: 2, payout: 320, guest: "Carter Young", source: "Direct" },
    // Current month
    { checkIn: addDays(months[2], 1), nights: 2, payout: 320, guest: "Scarlett King", source: "Airbnb" },
    { checkIn: addDays(months[2], 5), nights: 3, payout: 480, guest: "Jackson Wright", source: "Booking.com" },
    { checkIn: addDays(months[2], 10), nights: 2, payout: 320, guest: "Luna Lopez", source: "Airbnb" },
    { checkIn: addDays(months[2], 14), nights: 3, payout: 480, guest: "Sebastian Hill", source: "VRBO" },
  ];

  for (const r of midtownReservations) {
    await prisma.reservation.create({
      data: {
        propertyId: midtown.id,
        guestName: r.guest,
        checkIn: r.checkIn,
        checkOut: addDays(r.checkIn, r.nights),
        nightsBooked: r.nights,
        staysBooked: 1,
        bookingDate: addDays(r.checkIn, -7),
        status: "confirmed",
        payoutAmount: r.payout,
        source: r.source,
      },
    });
  }

  // ─── Expense Overrides (example: actual electricity for beachfront last month) ───
  const lastMonth = months[1];
  const lastMonthKey = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, "0")}`;
  const lastMonthEnd = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0);

  await prisma.financialPeriodOverride.create({
    data: {
      propertyId: beachfront.id,
      periodStart: lastMonth,
      periodEnd: lastMonthEnd,
      monthKey: lastMonthKey,
      electricityOverride: 285, // Actual electricity bill
      waterOverride: 120,       // Actual water bill
      notes: "Actual utility bills from provider",
    },
  });

  console.log("Seed complete!");
  console.log(`  - ${4} properties created`);
  console.log(`  - ${beachfrontReservations.length + downtownReservations.length + mountainReservations.length + midtownReservations.length} reservations created`);
  console.log(`  - 1 expense override created`);
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
