-- AlterEnum: Add missing value to InvitationStatus
ALTER TYPE "InvitationStatus" ADD VALUE IF NOT EXISTS 'declined';

-- AlterTable: Add missing columns to User table
ALTER TABLE "User" ADD COLUMN "displayName" TEXT,
ADD COLUMN "username" TEXT,
ADD COLUMN "bio" TEXT,
ADD COLUMN "lastActiveAt" TIMESTAMP(3),
ADD COLUMN "isOnline" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "profileVisibility" "ProfileVisibility" NOT NULL DEFAULT 'public',
ADD COLUMN "showEmail" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
