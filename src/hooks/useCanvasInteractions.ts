import { useCallback } from "react";
import Konva from "konva";
import { Node } from "@/types/CanvasTypes";
import {
  MIN_SIZE,
  MIN_SCALE,
  MAX_SCALE,
  SCALE_FACTOR,
} from "@/constants/CanvasConstants";

export const useCanvasInteractions = (
  nodes: Node[],
  setNodes: (nodes: Node[]) => void,
  saveToHistory: (newNodes: Node[]) => void,
  setSelectedId: (id: string | null) => void,
  setError: (error: string | null) => void,
  stageRef: React.RefObject<Konva.Stage>,
  stageScale: number,
  stagePosition: { x: number; y: number },
  setStagePosition: React.Dispatch<
    React.SetStateAction<{ x: number; y: number }>
  >,
  setStageScale: React.Dispatch<React.SetStateAction<number>>,
  isDraggingStage: boolean,
  setIsDraggingStage: (dragging: boolean) => void,
  lastPointerPosition: { x: number; y: number },
  setLastPointerPosition: (pos: { x: number; y: number }) => void,
  tool: "select" | "pan"
) => {
  const handleSelect = useCallback(
    (id: string | null) => {
      if (id) {
        const maxZIndex =
          nodes.length > 0 ? Math.max(...nodes.map((n) => n.zIndex)) : 0;
        const newNodes = nodes.map((node) =>
          node.id === id ? { ...node, zIndex: maxZIndex + 1 } : node
        );
        setNodes(newNodes);
        saveToHistory(newNodes);
      }
      setSelectedId(id);
      if (id) setError(null);
    },
    [nodes, setNodes, saveToHistory, setSelectedId, setError]
  );

  const handleDrag = useCallback(
    (id: string, e: Konva.KonvaEventObject<DragEvent>) => {
      try {
        const newNodes = nodes.map((node) =>
          node.id === id ? { ...node, x: e.target.x(), y: e.target.y() } : node
        );
        setNodes(newNodes);
        saveToHistory(newNodes);
      } catch (err) {
        setError("Failed to move shape. Please try again.");
        console.error("Error dragging shape:", err);
      }
    },
    [nodes, setNodes, saveToHistory, setError]
  );

  const handleTransform = useCallback(
    (id: string, e: Konva.KonvaEventObject<Event>) => {
      try {
        const node = nodes.find((n) => n.id === id);
        if (!node) return;

        const scaleX = e.target.scaleX();
        const scaleY = e.target.scaleY();

        e.target.scaleX(1);
        e.target.scaleY(1);

        const newNodes = nodes.map((n) => {
          if (n.id === id) {
            const newWidth = Math.max(MIN_SIZE, n.width * scaleX);
            const newHeight = Math.max(MIN_SIZE, n.height * scaleY);
            const newRadius =
              n.type === "circle"
                ? Math.max(MIN_SIZE / 2, n.radius * scaleX)
                : n.radius;

            return {
              ...n,
              x: e.target.x(),
              y: e.target.y(),
              width: newWidth,
              height: newHeight,
              radius: newRadius,
              rotation: e.target.rotation(),
            };
          }
          return n;
        });

        setNodes(newNodes);
      } catch (err) {
        setError("Failed to transform shape. Please try again.");
        console.error("Error transforming shape:", err);
      }
    },
    [nodes, setNodes, setError]
  );

  const handleTransformEnd = useCallback(() => {
    saveToHistory(nodes);
  }, [nodes, saveToHistory]);

  const handleWheel = useCallback(
    (e: Konva.KonvaEventObject<WheelEvent>) => {
      e.evt.preventDefault();
      try {
        const oldScale = stageScale;
        const pointer = stageRef.current?.getPointerPosition() ?? {
          x: 0,
          y: 0,
        };

        const mousePointTo = {
          x: (pointer.x - stagePosition.x) / oldScale,
          y: (pointer.y - stagePosition.y) / oldScale,
        };

        const newScale = Math.max(
          MIN_SCALE,
          Math.min(
            MAX_SCALE,
            e.evt.deltaY > 0 ? oldScale / SCALE_FACTOR : oldScale * SCALE_FACTOR
          )
        );

        setStageScale(newScale);
        setStagePosition({
          x: pointer.x - mousePointTo.x * newScale,
          y: pointer.y - mousePointTo.y * newScale,
        });
      } catch (err) {
        setError("Zoom failed. Please try again.");
        console.error("Error handling wheel:", err);
      }
    },
    [
      stageScale,
      stagePosition,
      stageRef,
      setStageScale,
      setStagePosition,
      setError,
    ]
  );

  const handleStageMouseDown = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (e.target === e.target.getStage() || tool === "pan") {
        handleSelect(null);
        setIsDraggingStage(true);
        setLastPointerPosition({
          x: e.evt.clientX,
          y: e.evt.clientY,
        });
      }
    },
    [tool, handleSelect, setIsDraggingStage, setLastPointerPosition]
  );

  const handleStageMouseMove = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (!isDraggingStage) return;

      const dx = e.evt.clientX - lastPointerPosition.x;
      const dy = e.evt.clientY - lastPointerPosition.y;

      setStagePosition((prev) => ({
        x: prev.x + dx,
        y: prev.y + dy,
      }));

      setLastPointerPosition({
        x: e.evt.clientX,
        y: e.evt.clientY,
      });
    },
    [
      isDraggingStage,
      lastPointerPosition,
      setStagePosition,
      setLastPointerPosition,
    ]
  );

  const handleStageMouseUp = useCallback(() => {
    setIsDraggingStage(false);
  }, [setIsDraggingStage]);

  return {
    handleSelect,
    handleDrag,
    handleTransform,
    handleTransformEnd,
    handleWheel,
    handleStageMouseDown,
    handleStageMouseMove,
    handleStageMouseUp,
  };
};
