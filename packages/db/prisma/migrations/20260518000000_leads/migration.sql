-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'CONTACTED', 'TRIAL', 'CONVERTED', 'LOST');

-- CreateTable
CREATE TABLE "Lead" (
    "id"           TEXT NOT NULL,
    "email"        TEXT NOT NULL,
    "phone"        TEXT,
    "telegram"     TEXT,
    "businessKind" TEXT,
    "message"      TEXT,
    "source"       TEXT NOT NULL DEFAULT 'landing',
    "status"       "LeadStatus" NOT NULL DEFAULT 'NEW',
    "notes"        TEXT,
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"    TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Lead_status_createdAt_idx" ON "Lead"("status", "createdAt");
CREATE INDEX "Lead_email_idx"            ON "Lead"("email");
