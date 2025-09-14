import { useCallback } from "react";
import {
  MIN_SCALE,
  MAX_SCALE,
  SCALE_FACTOR,
} from "@/constants/CanvasConstants";

export const useViewControls = (
  setStageScale: React.Dispatch<React.SetStateAction<number>>,
  setStagePosition: (pos: { x: number; y: number }) => void
) => {
  const zoomIn = useCallback(() => {
    setStageScale((prev) => Math.min(MAX_SCALE, prev * SCALE_FACTOR));
  }, [setStageScale]);

  const zoomOut = useCallback(() => {
    setStageScale((prev) => Math.max(MIN_SCALE, prev / SCALE_FACTOR));
  }, [setStageScale]);

  const resetView = useCallback(() => {
    setStageScale(1);
    setStagePosition({ x: 0, y: 0 });
  }, [setStageScale, setStagePosition]);

  return { zoomIn, zoomOut, resetView };
};
