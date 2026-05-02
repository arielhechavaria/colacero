-- Rename whatsappPhone → phone (fallback OTP) + add telegramId (primary auth)
ALTER TABLE "Customer" RENAME COLUMN "whatsappPhone" TO "phone";

-- Make phone optional (was NOT NULL)
ALTER TABLE "Customer" ALTER COLUMN "phone" DROP NOT NULL;

-- Add telegramId column
ALTER TABLE "Customer" ADD COLUMN "telegramId" TEXT;

-- Unique index for telegramId
CREATE UNIQUE INDEX "Customer_telegramId_key" ON "Customer"("telegramId");
