-- CreateTable
CREATE TABLE "AccessRequestEvent" (
    "id" TEXT NOT NULL,
    "accessRequestId" TEXT NOT NULL,
    "fromStatus" "RequestStatus",
    "toStatus" "RequestStatus" NOT NULL,
    "changedById" TEXT,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AccessRequestEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AccessRequestEvent_accessRequestId_idx" ON "AccessRequestEvent"("accessRequestId");

-- CreateIndex
CREATE INDEX "AccessRequestEvent_changedById_idx" ON "AccessRequestEvent"("changedById");

-- AddForeignKey
ALTER TABLE "AccessRequestEvent" ADD CONSTRAINT "AccessRequestEvent_accessRequestId_fkey" FOREIGN KEY ("accessRequestId") REFERENCES "AccessRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccessRequestEvent" ADD CONSTRAINT "AccessRequestEvent_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
