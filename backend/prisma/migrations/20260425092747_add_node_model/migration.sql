-- CreateEnum
CREATE TYPE "NodeType" AS ENUM ('rect', 'circle', 'text', 'frame', 'star', 'diamond', 'image');

-- CreateEnum
CREATE TYPE "StrokeStyle" AS ENUM ('solid', 'dashed');

-- CreateTable
CREATE TABLE "FrameNode" (
    "id" TEXT NOT NULL,
    "type" "NodeType" NOT NULL,
    "x" DOUBLE PRECISION NOT NULL,
    "y" DOUBLE PRECISION NOT NULL,
    "width" DOUBLE PRECISION NOT NULL,
    "height" DOUBLE PRECISION NOT NULL,
    "radius" DOUBLE PRECISION NOT NULL,
    "text" TEXT,
    "fill" TEXT NOT NULL,
    "stroke" TEXT NOT NULL,
    "strokeWidth" DOUBLE PRECISION NOT NULL,
    "rotation" DOUBLE PRECISION NOT NULL,
    "opacity" DOUBLE PRECISION NOT NULL,
    "fontSize" DOUBLE PRECISION NOT NULL,
    "fontFamily" TEXT NOT NULL,
    "zIndex" INTEGER NOT NULL,
    "strokeStyle" "StrokeStyle",
    "imageUrl" TEXT,
    "points" DOUBLE PRECISION[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FrameNode_pkey" PRIMARY KEY ("id")
);
