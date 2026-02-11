-- CreateEnum
CREATE TYPE "Region" AS ENUM ('LCK', 'LPL', 'LEC', 'LTA', 'OTHER');

-- CreateTable
CREATE TABLE "Player" (
    "id" TEXT NOT NULL,
    "region" "Region" NOT NULL,
    "leaguepediaId" INTEGER,
    "slug" TEXT NOT NULL,
    "name" TEXT,
    "country" TEXT,
    "role" TEXT,
    "teamName" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "dataHash" TEXT,
    "lastSyncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Player_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Player_leaguepediaId_key" ON "Player"("leaguepediaId");

-- CreateIndex
CREATE UNIQUE INDEX "Player_slug_key" ON "Player"("slug");

-- CreateIndex
CREATE INDEX "Player_region_isActive_idx" ON "Player"("region", "isActive");

-- CreateIndex
CREATE INDEX "Player_teamName_idx" ON "Player"("teamName");
