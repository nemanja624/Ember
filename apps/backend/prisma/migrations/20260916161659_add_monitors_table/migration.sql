-- CreateEnum
CREATE TYPE "MonitorType" AS ENUM ('HTTP', 'HTTPS');

-- CreateTable
CREATE TABLE "monitors" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "MonitorType" NOT NULL DEFAULT 'HTTP',
    "target" TEXT NOT NULL,
    "intervalSeconds" INTEGER NOT NULL,
    "timeoutMs" INTEGER NOT NULL,
    "expectedStatus" INTEGER NOT NULL DEFAULT 200,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "monitors_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "monitors" ADD CONSTRAINT "monitors_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
