-- Wipe existing tables (safe for fresh or existing databases)
DROP TABLE IF EXISTS "AccessRequestEvent" CASCADE;
DROP TABLE IF EXISTS "AccessRequest" CASCADE;
DROP TABLE IF EXISTS "ProjectInvitation" CASCADE;
DROP TABLE IF EXISTS "PageVisit" CASCADE;
DROP TABLE IF EXISTS "ProjectMember" CASCADE;
DROP TABLE IF EXISTS "Notification" CASCADE;
DROP TABLE IF EXISTS "Node" CASCADE;
DROP TABLE IF EXISTS "Page" CASCADE;
DROP TABLE IF EXISTS "Project" CASCADE;
DROP TABLE IF EXISTS "User" CASCADE;

-- Drop old enums
DROP TYPE IF EXISTS "NodeType" CASCADE;
DROP TYPE IF EXISTS "StrokeStyle" CASCADE;
DROP TYPE IF EXISTS "ProjectVisibility" CASCADE;
DROP TYPE IF EXISTS "MemberRole" CASCADE;
DROP TYPE IF EXISTS "InvitationStatus" CASCADE;
DROP TYPE IF EXISTS "ProfileVisibility" CASCADE;
DROP TYPE IF EXISTS "RequestStatus" CASCADE;

-- CreateEnum
CREATE TYPE "NodeType" AS ENUM ('rect', 'circle', 'text', 'frame', 'star', 'diamond', 'image');

-- CreateEnum
CREATE TYPE "StrokeStyle" AS ENUM ('solid', 'dashed');

-- CreateEnum
CREATE TYPE "ProjectVisibility" AS ENUM ('public', 'private');

-- CreateEnum
CREATE TYPE "MemberRole" AS ENUM ('owner', 'editor', 'viewer');

-- CreateEnum
CREATE TYPE "InvitationStatus" AS ENUM ('pending', 'accepted', 'declined', 'cancelled', 'expired');

-- CreateEnum
CREATE TYPE "ProfileVisibility" AS ENUM ('public', 'private');

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('pending', 'approved', 'denied', 'cancelled');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "firstName" TEXT,
    "imageUrl" TEXT,
    "lastName" TEXT,
    "displayName" TEXT,
    "username" TEXT,
    "bio" TEXT,
    "lastActiveAt" TIMESTAMP(3),
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "profileVisibility" "ProfileVisibility" NOT NULL DEFAULT 'public',
    "showEmail" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "actorId" TEXT,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT,
    "projectId" TEXT,
    "metadata" JSONB,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "thumbnail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ownerId" TEXT NOT NULL,
    "visibility" "ProjectVisibility" NOT NULL DEFAULT 'public',

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Page" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'Page 1',
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "projectId" TEXT NOT NULL,

    CONSTRAINT "Page_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Node" (
    "id" TEXT NOT NULL,
    "parentId" TEXT,
    "pageId" TEXT NOT NULL,
    "type" "NodeType" NOT NULL,
    "x" DOUBLE PRECISION NOT NULL,
    "y" DOUBLE PRECISION NOT NULL,
    "width" DOUBLE PRECISION NOT NULL,
    "height" DOUBLE PRECISION NOT NULL,
    "radius" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "text" TEXT,
    "fill" TEXT NOT NULL DEFAULT '#ffffff',
    "stroke" TEXT NOT NULL DEFAULT '#000000',
    "strokeWidth" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "strokeStyle" "StrokeStyle" NOT NULL DEFAULT 'solid',
    "rotation" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "opacity" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "fontSize" DOUBLE PRECISION NOT NULL DEFAULT 14,
    "fontFamily" TEXT NOT NULL DEFAULT 'Arial',
    "zIndex" INTEGER NOT NULL DEFAULT 0,
    "imageUrl" TEXT,
    "points" DOUBLE PRECISION[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Node_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectMember" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "MemberRole" NOT NULL DEFAULT 'editor',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "favoritedAt" TIMESTAMP(3),
    "archivedAt" TIMESTAMP(3),
    "lastOpenedAt" TIMESTAMP(3),
    "pinnedAt" TIMESTAMP(3),

    CONSTRAINT "ProjectMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PageVisit" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "pageId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "visitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PageVisit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectInvitation" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "invitedById" TEXT NOT NULL,
    "email" TEXT,
    "userId" TEXT,
    "token" TEXT NOT NULL,
    "status" "InvitationStatus" NOT NULL DEFAULT 'pending',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "message" TEXT,
    "role" "MemberRole" NOT NULL DEFAULT 'editor',
    "oneTime" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccessRequest" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "RequestStatus" NOT NULL DEFAULT 'pending',
    "message" TEXT,
    "requestedRole" TEXT NOT NULL DEFAULT 'editor',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccessRequest_pkey" PRIMARY KEY ("id")
);

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
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_userId_read_idx" ON "Notification"("userId", "read");

-- CreateIndex
CREATE INDEX "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_userId_type_idx" ON "Notification"("userId", "type");

-- CreateIndex
CREATE INDEX "Project_ownerId_idx" ON "Project"("ownerId");

-- CreateIndex
CREATE INDEX "Page_projectId_idx" ON "Page"("projectId");

-- CreateIndex
CREATE INDEX "Node_pageId_idx" ON "Node"("pageId");

-- CreateIndex
CREATE INDEX "Node_parentId_idx" ON "Node"("parentId");

-- CreateIndex
CREATE INDEX "ProjectMember_userId_idx" ON "ProjectMember"("userId");

-- CreateIndex
CREATE INDEX "ProjectMember_projectId_idx" ON "ProjectMember"("projectId");

-- CreateIndex
CREATE INDEX "ProjectMember_archivedAt_idx" ON "ProjectMember"("archivedAt");

-- CreateIndex
CREATE INDEX "ProjectMember_favoritedAt_idx" ON "ProjectMember"("favoritedAt");

-- CreateIndex
CREATE INDEX "ProjectMember_pinnedAt_idx" ON "ProjectMember"("pinnedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectMember_projectId_userId_key" ON "ProjectMember"("projectId", "userId");

-- CreateIndex
CREATE INDEX "PageVisit_userId_visitedAt_idx" ON "PageVisit"("userId", "visitedAt");

-- CreateIndex
CREATE INDEX "PageVisit_pageId_idx" ON "PageVisit"("pageId");

-- CreateIndex
CREATE INDEX "PageVisit_projectId_idx" ON "PageVisit"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectInvitation_token_key" ON "ProjectInvitation"("token");

-- CreateIndex
CREATE INDEX "ProjectInvitation_projectId_idx" ON "ProjectInvitation"("projectId");

-- CreateIndex
CREATE INDEX "ProjectInvitation_userId_idx" ON "ProjectInvitation"("userId");

-- CreateIndex
CREATE INDEX "ProjectInvitation_email_idx" ON "ProjectInvitation"("email");

-- CreateIndex
CREATE INDEX "ProjectInvitation_status_idx" ON "ProjectInvitation"("status");

-- CreateIndex
CREATE INDEX "ProjectInvitation_token_idx" ON "ProjectInvitation"("token");

-- CreateIndex
CREATE INDEX "AccessRequest_userId_idx" ON "AccessRequest"("userId");

-- CreateIndex
CREATE INDEX "AccessRequest_projectId_idx" ON "AccessRequest"("projectId");

-- CreateIndex
CREATE INDEX "AccessRequest_status_idx" ON "AccessRequest"("status");

-- CreateIndex
CREATE UNIQUE INDEX "AccessRequest_projectId_userId_key" ON "AccessRequest"("projectId", "userId");

-- CreateIndex
CREATE INDEX "AccessRequestEvent_accessRequestId_idx" ON "AccessRequestEvent"("accessRequestId");

-- CreateIndex
CREATE INDEX "AccessRequestEvent_changedById_idx" ON "AccessRequestEvent"("changedById");

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Page" ADD CONSTRAINT "Page_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Node" ADD CONSTRAINT "Node_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "Page"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Node" ADD CONSTRAINT "Node_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Node"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectMember" ADD CONSTRAINT "ProjectMember_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectMember" ADD CONSTRAINT "ProjectMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PageVisit" ADD CONSTRAINT "PageVisit_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "Page"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PageVisit" ADD CONSTRAINT "PageVisit_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectInvitation" ADD CONSTRAINT "ProjectInvitation_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectInvitation" ADD CONSTRAINT "ProjectInvitation_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectInvitation" ADD CONSTRAINT "ProjectInvitation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccessRequest" ADD CONSTRAINT "AccessRequest_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccessRequest" ADD CONSTRAINT "AccessRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccessRequestEvent" ADD CONSTRAINT "AccessRequestEvent_accessRequestId_fkey" FOREIGN KEY ("accessRequestId") REFERENCES "AccessRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccessRequestEvent" ADD CONSTRAINT "AccessRequestEvent_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
