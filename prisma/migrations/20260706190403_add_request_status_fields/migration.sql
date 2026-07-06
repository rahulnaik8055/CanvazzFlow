-- AlterEnum
ALTER TYPE "RequestStatus" ADD VALUE 'cancelled';

-- AlterTable
ALTER TABLE "AccessRequest" ADD COLUMN     "requestedRole" TEXT NOT NULL DEFAULT 'editor';

-- CreateIndex
CREATE INDEX "AccessRequest_status_idx" ON "AccessRequest"("status");
