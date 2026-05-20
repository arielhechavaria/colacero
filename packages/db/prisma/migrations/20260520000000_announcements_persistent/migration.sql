-- CreateEnum
CREATE TYPE "AnnouncementStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'SENDING', 'SENT', 'FAILED', 'CANCELLED');

-- CreateTable
CREATE TABLE "Announcement" (
    "id"           TEXT NOT NULL,
    "businessId"   TEXT NOT NULL,
    "text"         TEXT NOT NULL,
    "template"     TEXT,
    "productIds"   TEXT[] DEFAULT ARRAY[]::TEXT[],
    "imageUrl"     TEXT,
    "generatedPng" TEXT,
    "scheduledAt"  TIMESTAMP(3),
    "status"       "AnnouncementStatus" NOT NULL DEFAULT 'DRAFT',
    "sentAt"       TIMESTAMP(3),
    "errorMessage" TEXT,
    "jobId"        TEXT,
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"    TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Announcement_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Announcement_businessId_createdAt_idx" ON "Announcement"("businessId", "createdAt" DESC);
CREATE INDEX "Announcement_scheduledAt_status_idx"  ON "Announcement"("scheduledAt", "status");

ALTER TABLE "Announcement" ADD CONSTRAINT "Announcement_businessId_fkey"
    FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
