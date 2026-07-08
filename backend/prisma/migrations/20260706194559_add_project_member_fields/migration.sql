-- AlterTable
ALTER TABLE "ProjectMember" ADD COLUMN     "archivedAt" TIMESTAMP(3),
ADD COLUMN     "favoritedAt" TIMESTAMP(3),
ADD COLUMN     "lastOpenedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "ProjectMember_archivedAt_idx" ON "ProjectMember"("archivedAt");

-- CreateIndex
CREATE INDEX "ProjectMember_favoritedAt_idx" ON "ProjectMember"("favoritedAt");
