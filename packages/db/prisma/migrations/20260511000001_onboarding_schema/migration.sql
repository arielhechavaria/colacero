-- CreateEnum
CREATE TYPE "BusinessStatus" AS ENUM ('ACTIVE', 'PENDING_VERIFICATION', 'SUSPENDED');

-- AlterEnum: add SUPER_ADMIN to UserRole
ALTER TYPE "UserRole" ADD VALUE 'SUPER_ADMIN';

-- AlterTable Business: add status + onboardedAt
ALTER TABLE "Business" ADD COLUMN "status"      "BusinessStatus" NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE "Business" ADD COLUMN "onboardedAt" TIMESTAMP(3);

-- AlterTable User: change email unique from (businessId, email) to email global
DROP INDEX IF EXISTS "User_businessId_email_key";
ALTER TABLE "User" DROP CONSTRAINT IF EXISTS "User_businessId_email_key";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
