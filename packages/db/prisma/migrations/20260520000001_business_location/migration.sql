-- AlterTable: agregar campos de ubicación al negocio
ALTER TABLE "Business" ADD COLUMN "address"   TEXT;
ALTER TABLE "Business" ADD COLUMN "latitude"  DECIMAL(10,8);
ALTER TABLE "Business" ADD COLUMN "longitude" DECIMAL(11,8);
