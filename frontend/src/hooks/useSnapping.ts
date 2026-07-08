import { useState, useCallback, useRef } from "react";
import { Node } from "@/types/CanvasTypes";
import { GRID_SIZE, SNAP_TOLERANCE } from "@/constants/CanvasConstants";

export interface SnapGuide {
  orientation: "vertical" | "horizontal";
  position: number;
}

interface SnapResult {
  x: number;
  y: number;
  guides: SnapGuide[];
}

type EdgeKey = "left" | "centerX" | "right" | "top" | "centerY" | "bottom";

function getEdges(node: Node) {
  const w =
    node.type === "circle" ? node.radius * 2 : node.width;
  const h =
    node.type === "circle" ? node.radius * 2 : node.height;
  return {
    left: node.x,
    centerX: node.x + w / 2,
    right: node.x + w,
    top: node.y,
    centerY: node.y + h / 2,
    bottom: node.y + h,
  };
}

const X_EDGES: EdgeKey[] = ["left", "centerX", "right"];
const Y_EDGES: EdgeKey[] = ["top", "centerY", "bottom"];

export function useSnapping(
  snapToGrid: boolean,
  smartGuides: boolean,
  gridSize: number = GRID_SIZE,
  tolerance: number = SNAP_TOLERANCE,
) {
  const [guides, setGuides] = useState<SnapGuide[]>([]);
  const otherEdgesRef = useRef<ReturnType<typeof getEdges>[]>([]);

  const snapValueToGrid = useCallback(
    (value: number) => Math.round(value / gridSize) * gridSize,
    [gridSize],
  );

  const prepareSnapTargets = useCallback((allNodes: Node[], draggedId: string) => {
    otherEdgesRef.current = allNodes
      .filter((n) => n.id !== draggedId)
      .map(getEdges);
  }, []);

  const computeSnap = useCallback(
    (draggedNode: Node, allNodes: Node[]): SnapResult => {
      const newGuides: SnapGuide[] = [];
      let x = draggedNode.x;
      let y = draggedNode.y;

      if (snapToGrid) {
        x = snapValueToGrid(x);
        y = snapValueToGrid(y);
      }

      let snappedX = false;
      let snappedY = false;

      if (smartGuides) {
        const dEdges = getEdges({ ...draggedNode, x, y });
        const targets =
          otherEdgesRef.current.length > 0
            ? otherEdgesRef.current
            : allNodes
                .filter((n) => n.id !== draggedNode.id)
                .map(getEdges);

        let bestXDx = Infinity;
        let bestYDy = Infinity;
        let bestXGuide: SnapGuide | null = null;
        let bestYGuide: SnapGuide | null = null;

        for (const t of targets) {
          for (const dEdge of X_EDGES) {
            for (const tEdge of X_EDGES) {
              const dVal = dEdges[dEdge];
              const tVal = t[tEdge];
              const dx = tVal - dVal;
              if (Math.abs(dx) < tolerance && Math.abs(dx) < Math.abs(bestXDx)) {
                bestXDx = dx;
                bestXGuide = { orientation: "vertical", position: tVal };
              }
            }
          }

          for (const dEdge of Y_EDGES) {
            for (const tEdge of Y_EDGES) {
              const dVal = dEdges[dEdge];
              const tVal = t[tEdge];
              const dy = tVal - dVal;
              if (Math.abs(dy) < tolerance && Math.abs(dy) < Math.abs(bestYDy)) {
                bestYDy = dy;
                bestYGuide = { orientation: "horizontal", position: tVal };
              }
            }
          }
        }

        if (bestXGuide) {
          x += bestXDx;
          snappedX = true;
          newGuides.push(bestXGuide);
        }

        if (bestYGuide) {
          y += bestYDy;
          snappedY = true;
          newGuides.push(bestYGuide);
        }
      }

      if (snapToGrid) {
        if (!snappedX) x = snapValueToGrid(x);
        if (!snappedY) y = snapValueToGrid(y);
      }

      setGuides(newGuides);
      return { x, y, guides: newGuides };
    },
    [snapToGrid, smartGuides, tolerance, snapValueToGrid],
  );

  const clearGuides = useCallback(() => {
    setGuides([]);
  }, []);

  return { guides, computeSnap, clearGuides, prepareSnapTargets };
}
