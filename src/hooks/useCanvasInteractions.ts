import { useCallback, useRef, useState } from "react";
import Konva from "konva";
import { Node } from "@/types/CanvasTypes";
import {
  MIN_SIZE,
  MIN_SCALE,
  MAX_SCALE,
  SCALE_FACTOR,
} from "@/constants/CanvasConstants";

export interface SelectionRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const useCanvasInteractions = (
  nodes: Node[],
  setNodes: (nodes: Node[]) => void,
  saveToHistory: (newNodes: Node[]) => void,
  setSelectedIds: (ids: string[] | ((prev: string[]) => string[])) => void,
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
  tool: "select" | "pan",
  selectedIds: string[],
  canEdit: boolean,
) => {
  const [selectionRect, setSelectionRect] = useState<SelectionRect | null>(null);
  const isSelectingRef = useRef(false);
  const selectStartRef = useRef({ x: 0, y: 0 });
  const dragStartMapRef = useRef<Map<string, { x: number; y: number }>>(new Map());

  const getCanvasPos = useCallback(
    (clientX: number, clientY: number) => {
      const stage = stageRef.current;
      if (!stage) return { x: 0, y: 0 };
      const transform = stage.getAbsoluteTransform().copy();
      transform.invert();
      return transform.point({ x: clientX - stage.x(), y: clientY - stage.y() });
    },
    [stageRef],
  );

  const getStagePointer = useCallback(() => {
    return stageRef.current?.getPointerPosition() ?? { x: 0, y: 0 };
  }, [stageRef]);

  const handleSelect = useCallback(
    (id: string | null, metaKey?: boolean, shiftKey?: boolean) => {
      const mod = metaKey || shiftKey;
      if (id && canEdit) {
        const maxZIndex =
          nodes.length > 0 ? Math.max(...nodes.map((n) => n.zIndex)) : 0;
        const newNodes = nodes.map((node) =>
          node.id === id ? { ...node, zIndex: maxZIndex + 1 } : node,
        );
        setNodes(newNodes);
        saveToHistory(newNodes);
      }
      if (mod) {
        setSelectedIds((prev) => {
          if (!id) return prev;
          return prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id];
        });
      } else {
        setSelectedIds(id ? [id] : []);
      }
      if (id) setError(null);
    },
    [nodes, setNodes, saveToHistory, setSelectedIds, setError, canEdit],
  );

  const handleDrag = useCallback(
    (id: string, e: Konva.KonvaEventObject<DragEvent>) => {
      try {
        const isMulti = selectedIds.includes(id) && selectedIds.length > 1;
        const newNodes = nodes.map((node) => {
          if (node.id === id) {
            return { ...node, x: e.target.x(), y: e.target.y() };
          }
          if (isMulti && selectedIds.includes(node.id)) {
            const start = dragStartMapRef.current.get(node.id);
            if (start) {
              const dragged = dragStartMapRef.current.get(id);
              if (dragged) {
                const dx = e.target.x() - dragged.x;
                const dy = e.target.y() - dragged.y;
                return { ...node, x: start.x + dx, y: start.y + dy };
              }
            }
          }
          return node;
        });
        setNodes(newNodes);
        saveToHistory(newNodes);
      } catch (err) {
        setError("Failed to move shape. Please try again.");
        console.error("Error dragging shape:", err);
      }
    },
    [nodes, selectedIds, setNodes, saveToHistory, setError],
  );

  const handleDragStartInternal = useCallback(
    (id: string) => {
      dragStartMapRef.current.clear();
      selectedIds.forEach((sid) => {
        const n = nodes.find((nd) => nd.id === sid);
        if (n) dragStartMapRef.current.set(sid, { x: n.x, y: n.y });
      });
      if (!dragStartMapRef.current.has(id)) {
        dragStartMapRef.current.set(id, { x: 0, y: 0 });
      }
    },
    [nodes, selectedIds],
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
    [nodes, setNodes, setError],
  );

  const handleTransformEnd = useCallback(() => {
    saveToHistory(nodes);
  }, [nodes, saveToHistory]);

  const handleWheel = useCallback(
    (e: Konva.KonvaEventObject<WheelEvent>) => {
      e.evt.preventDefault();
      try {
        const isZoom = e.evt.ctrlKey || e.evt.metaKey;

        if (isZoom) {
          const oldScale = stageScale;
          const pointer = stageRef.current?.getPointerPosition() ?? { x: 0, y: 0 };

          const mousePointTo = {
            x: (pointer.x - stagePosition.x) / oldScale,
            y: (pointer.y - stagePosition.y) / oldScale,
          };

          const newScale = Math.max(
            MIN_SCALE,
            Math.min(
              MAX_SCALE,
              e.evt.deltaY > 0
                ? oldScale / SCALE_FACTOR
                : oldScale * SCALE_FACTOR,
            ),
          );

          setStageScale(newScale);
          setStagePosition({
            x: pointer.x - mousePointTo.x * newScale,
            y: pointer.y - mousePointTo.y * newScale,
          });
        } else {
          setStagePosition((prev) => ({
            x: prev.x - e.evt.deltaX / stageScale,
            y: prev.y - e.evt.deltaY / stageScale,
          }));
        }
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
    ],
  );

  const handleStageMouseDown = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (tool === "pan") {
        setIsDraggingStage(true);
        setLastPointerPosition({
          x: e.evt.clientX,
          y: e.evt.clientY,
        });
        return;
      }

      if (e.target === e.target.getStage()) {
        const canvasPos = getCanvasPos(e.evt.clientX, e.evt.clientY);
        selectStartRef.current = canvasPos;
        isSelectingRef.current = true;

        if (!e.evt.shiftKey && !e.evt.metaKey) {
          setSelectedIds([]);
        }

        setSelectionRect({ x: canvasPos.x, y: canvasPos.y, width: 0, height: 0 });
      }
    },
    [tool, getCanvasPos, setSelectedIds, setIsDraggingStage, setLastPointerPosition],
  );

  const handleStageMouseMove = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (isDraggingStage) {
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
        return;
      }

      if (isSelectingRef.current) {
        const canvasPos = getCanvasPos(e.evt.clientX, e.evt.clientY);
        const start = selectStartRef.current;
        const x = Math.min(start.x, canvasPos.x);
        const y = Math.min(start.y, canvasPos.y);
        const w = Math.abs(canvasPos.x - start.x);
        const h = Math.abs(canvasPos.y - start.y);
        setSelectionRect({ x, y, width: w, height: h });
      }
    },
    [
      isDraggingStage,
      lastPointerPosition,
      setStagePosition,
      setLastPointerPosition,
      getCanvasPos,
    ],
  );

  const rectsOverlap = useCallback(
    (r1: { x: number; y: number; w: number; h: number }, r2: { x: number; y: number; w: number; h: number }) => {
      return r1.x < r2.x + r2.w && r1.x + r1.w > r2.x && r1.y < r2.y + r2.h && r1.y + r1.h > r2.y;
    },
    [],
  );

  const handleStageMouseUp = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (isDraggingStage) {
        setIsDraggingStage(false);
        return;
      }

      if (isSelectingRef.current) {
        isSelectingRef.current = false;
        const sr = selectionRect;
        if (sr && (sr.width > 2 || sr.height > 2)) {
          const shift = e.evt.shiftKey || e.evt.metaKey;
          const found = nodes.filter((n) => {
            const bw = n.type === "circle" ? n.radius * 2 : n.width;
            const bh = n.type === "circle" ? n.radius * 2 : n.height;
            return rectsOverlap(
              { x: sr.x, y: sr.y, w: sr.width, h: sr.height },
              { x: n.x, y: n.y, w: bw, h: bh },
            );
          }).map((n) => n.id);

          if (shift) {
            setSelectedIds((prev) => {
              const set = new Set(prev);
              found.forEach((id) => set.add(id));
              return Array.from(set);
            });
          } else {
            setSelectedIds(found);
          }
          setError(null);
        }
        setSelectionRect(null);
      }
    },
    [selectionRect, nodes, rectsOverlap, setSelectedIds, setIsDraggingStage, setError],
  );

  return {
    handleSelect,
    handleDrag,
    handleDragStart: handleDragStartInternal,
    handleTransform,
    handleTransformEnd,
    handleWheel,
    handleStageMouseDown,
    handleStageMouseMove,
    handleStageMouseUp,
    selectionRect,
  };
};
