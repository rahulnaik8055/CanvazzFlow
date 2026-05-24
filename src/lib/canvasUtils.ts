import { Node } from "@/types/CanvasTypes";

export const generateId = (): string =>
  `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

export const calculateShapeCenter = (
  stagePosition: { x: number; y: number },
  canvasSize: { width: number; height: number },
  stageScale: number
): { x: number; y: number } => {
  const centerX = (-stagePosition.x + canvasSize.width / 2) / stageScale;
  const centerY = (-stagePosition.y + canvasSize.height / 2) / stageScale;
  return { x: centerX - 60, y: centerY - 40 };
};
