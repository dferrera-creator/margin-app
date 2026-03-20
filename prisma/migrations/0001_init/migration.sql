-- CreateTable
CREATE TABLE "properties" (
    "id" TEXT NOT NULL,
    "guestyListingId" TEXT,
    "nickname" TEXT NOT NULL,
    "title" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "businessModel" TEXT NOT NULL DEFAULT 'commission',
    "commissionRate" DOUBLE PRECISION,
    "fixedOwnerPayoutMonthly" DOUBLE PRECISION,
    "internetMonthly" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "hoaMonthly" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "defaultElectricityPerNight" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "defaultWaterPerNight" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "defaultGasPerNight" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "defaultHousekeepingPerStay" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "defaultLaundryPerStay" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "pmsSoftwareMonthly" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "autorankMonthly" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "rmsSoftwareMonthly" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "messagingSoftwareMonthly" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "properties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reservations" (
    "id" TEXT NOT NULL,
    "guestyReservationId" TEXT,
    "propertyId" TEXT NOT NULL,
    "guestName" TEXT,
    "checkIn" TIMESTAMP(3) NOT NULL,
    "checkOut" TIMESTAMP(3) NOT NULL,
    "nightsBooked" INTEGER NOT NULL,
    "staysBooked" INTEGER NOT NULL DEFAULT 1,
    "bookingDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'confirmed',
    "payoutAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ownerPayoutAmount" DOUBLE PRECISION,
    "source" TEXT,
    "rawPayload" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reservations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "financial_period_overrides" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "monthKey" TEXT,
    "electricityOverride" DOUBLE PRECISION,
    "waterOverride" DOUBLE PRECISION,
    "gasOverride" DOUBLE PRECISION,
    "internetOverride" DOUBLE PRECISION,
    "hoaOverride" DOUBLE PRECISION,
    "housekeepingOverride" DOUBLE PRECISION,
    "laundryOverride" DOUBLE PRECISION,
    "pmsSoftwareOverride" DOUBLE PRECISION,
    "autorankOverride" DOUBLE PRECISION,
    "rmsSoftwareOverride" DOUBLE PRECISION,
    "messagingSoftwareOverride" DOUBLE PRECISION,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "financial_period_overrides_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sync_jobs" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'guesty',
    "syncType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "recordsProcessed" INTEGER NOT NULL DEFAULT 0,
    "errorLog" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sync_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "properties_guestyListingId_key" ON "properties"("guestyListingId");

-- CreateIndex
CREATE UNIQUE INDEX "reservations_guestyReservationId_key" ON "reservations"("guestyReservationId");

-- CreateIndex
CREATE INDEX "reservations_propertyId_idx" ON "reservations"("propertyId");

-- CreateIndex
CREATE INDEX "reservations_checkIn_idx" ON "reservations"("checkIn");

-- CreateIndex
CREATE INDEX "reservations_checkOut_idx" ON "reservations"("checkOut");

-- CreateIndex
CREATE INDEX "financial_period_overrides_propertyId_idx" ON "financial_period_overrides"("propertyId");

-- CreateIndex
CREATE UNIQUE INDEX "financial_period_overrides_propertyId_monthKey_key" ON "financial_period_overrides"("propertyId", "monthKey");

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_period_overrides" ADD CONSTRAINT "financial_period_overrides_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;
