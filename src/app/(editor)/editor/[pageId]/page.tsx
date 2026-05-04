"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Konva from "konva";
import { useParams, useRouter } from "next/navigation";
import { useApi } from "@/lib/api";

import LoadingOverlay from "@/components/LoadingOverlay";
import { Node } from "@/types/CanvasTypes";
import { useCanvasHistory } from "@/hooks/useCanvasHistory";
import { useShapeActions } from "@/hooks/useShapeActions";
import { useCanvasInteractions } from "@/hooks/useCanvasInteractions";
import { useViewControls } from "@/hooks/useViewControl";
import { useSyncEngine, Delta } from "@/hooks/useSyncEngine";
import InspectorPanel from "@/components/InspectorPanel";
import CanvasArea from "@/components/CanvasArea";
import LeftSidebar from "@/components/LeftSidebar";
import TopToolbar from "@/components/TopToolbar";

export default function EditorPage() {
  const { pageId } = useParams<{ pageId: string }>();
  const router = useRouter();
  const api = useApi();

  const [nodes, setNodes] = useState<Node[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tool, setTool] = useState<"select" | "pan">("select");
  const [stageScale, setStageScale] = useState<number>(1);
  const [stagePosition, setStagePosition] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  const [isDraggingStage, setIsDraggingStage] = useState<boolean>(false);
  const [lastPointerPosition, setLastPointerPosition] = useState<{
    x: number;
    y: number;
  }>({ x: 0, y: 0 });
  const [canvasSize, setCanvasSize] = useState<{
    width: number;
    height: number;
  }>({ width: 0, height: 0 });
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const transformerRef = useRef<Konva.Transformer>(null);
  const stageRef = useRef<Konva.Stage>(null) as React.RefObject<Konva.Stage>;
  const nodesRef = useRef<Node[]>([]);
  const prevNodesRef = useRef<Node[]>([]);
  const isInitialLoad = useRef<boolean>(true);

  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);

  const { enqueue, forceFlush, retry, syncStatus } = useSyncEngine(
    useCallback(
      async (delta: Delta) => {
        await api.patch(`pages/${pageId}/nodes`, delta);
      },
      [pageId],
    ),
    { debounceMs: 800, maxRetries: 3, retryBaseMs: 1000 },
  );

  useEffect(() => {
    if (isInitialLoad.current) {
      prevNodesRef.current = nodes;
      isInitialLoad.current = false;
      return;
    }

    const prev = prevNodesRef.current;
    const curr = nodes;

    const prevMap = new Map(prev.map((n) => [n.id, n]));
    const currMap = new Map(curr.map((n) => [n.id, n]));

    curr.forEach((node) => {
      const prevNode = prevMap.get(node.id);
      if (!prevNode || JSON.stringify(prevNode) !== JSON.stringify(node)) {
        enqueue({ type: "upsert", node }, curr);
      }
    });

    prev.forEach((node) => {
      if (!currMap.has(node.id)) {
        enqueue({ type: "delete", id: node.id }, curr);
      }
    });

    prevNodesRef.current = curr;
  }, [nodes, enqueue]);

  const {
    saveToHistory,
    undo: historyUndo,
    redo: historyRedo,
    historyStep,
    history,
  } = useCanvasHistory(nodes);

  const { addShape, duplicateShape, deleteShape, updateNodeProperty } =
    useShapeActions(
      nodes,
      setNodes,
      saveToHistory,
      stagePosition,
      canvasSize,
      stageScale,
      setSelectedId,
      setTool,
      setError,
    );

  const { zoomIn, zoomOut, resetView } = useViewControls(
    setStageScale,
    setStagePosition,
  );

  const {
    handleSelect,
    handleDrag,
    handleTransform,
    handleTransformEnd,
    handleWheel,
    handleStageMouseDown,
    handleStageMouseMove,
    handleStageMouseUp,
  } = useCanvasInteractions(
    nodes,
    setNodes,
    saveToHistory,
    setSelectedId,
    setError,
    stageRef,
    stageScale,
    stagePosition,
    setStagePosition,
    setStageScale,
    isDraggingStage,
    setIsDraggingStage,
    lastPointerPosition,
    setLastPointerPosition,
    tool,
  );

  const handleDragWithSave = useCallback(
    (...args: Parameters<typeof handleDrag>) => {
      handleDrag(...args);
      const event = args[0] as any;
      if (event?.type === "dragend") {
        setTimeout(() => {
          nodesRef.current.forEach((node) =>
            enqueue({ type: "upsert", node }, nodesRef.current),
          );
        }, 0);
      }
    },
    [handleDrag, enqueue],
  );

  useEffect(() => {
    const fetchNodes = async () => {
      setIsLoading(true);
      isInitialLoad.current = true;
      try {
        const data = await api.get(`pages/${pageId}/nodes`);
        setNodes(data);
      } catch (err) {
        console.error("Failed to load nodes:", err);
        setError("Failed to load canvas.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchNodes();
  }, [pageId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      switch (e.key) {
        case "s":
          e.preventDefault();
          forceFlush(nodesRef.current);
          break;
        case "z":
          e.preventDefault();
          if (e.shiftKey) historyRedo(setNodes, setSelectedId);
          else historyUndo(setNodes, setSelectedId);
          break;
        case "c":
          if (selectedId) {
            e.preventDefault();
            duplicateShape(selectedId);
          }
          break;
        case "Delete":
        case "Backspace":
          if (selectedId) {
            e.preventDefault();
            deleteShape(selectedId);
          }
          break;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    selectedId,
    historyUndo,
    historyRedo,
    duplicateShape,
    deleteShape,
    forceFlush,
  ]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (syncStatus === "pending" || syncStatus === "error") {
        forceFlush(nodesRef.current);
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [syncStatus, forceFlush]);

  useEffect(() => {
    const update = () =>
      setCanvasSize({
        width: Math.max(400, window.innerWidth - 520),
        height: Math.max(300, window.innerHeight - 60),
      });
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  useEffect(() => {
    if (
      tool === "select" &&
      selectedId &&
      transformerRef.current &&
      stageRef.current
    ) {
      const node = stageRef.current.findOne(`#${selectedId}`);
      if (node) {
        transformerRef.current.nodes([node]);
        transformerRef.current.getLayer()?.batchDraw();
      }
    }
  }, [selectedId, nodes, tool]);

  const selectedNode = nodes.find((n) => n.id === selectedId) || null;

  const saveIndicator =
    syncStatus === "idle"
      ? "idle"
      : syncStatus === "pending"
        ? "pending"
        : syncStatus === "syncing"
          ? "syncing"
          : syncStatus === "retrying"
            ? "retrying"
            : "error";

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-gray-50 font-sans">
      <TopToolbar
        tool={tool}
        setTool={setTool}
        undo={() => historyUndo(setNodes, setSelectedId)}
        redo={() => historyRedo(setNodes, setSelectedId)}
        zoomIn={zoomIn}
        zoomOut={zoomOut}
        resetView={resetView}
        stageScale={stageScale}
        canUndo={historyStep > 0}
        canRedo={historyStep < history.length - 1}
        saveIndicator={saveIndicator}
        onSave={() => forceFlush(nodesRef.current)}
        onBack={() => router.back()}
      />

      <LeftSidebar
        showGrid={showGrid}
        setShowGrid={setShowGrid}
        error={error}
      />

      <CanvasArea
        addShape={addShape}
        nodes={nodes}
        canvasSize={canvasSize}
        stageScale={stageScale}
        stagePosition={stagePosition}
        showGrid={showGrid}
        selectedId={selectedId}
        tool={tool}
        zoomIn={zoomIn}
        zoomOut={zoomOut}
        resetView={resetView}
        stageRef={stageRef}
        transformerRef={transformerRef}
        handleSelect={handleSelect}
        handleDrag={handleDragWithSave}
        handleTransform={handleTransform}
        handleTransformEnd={handleTransformEnd}
        handleWheel={handleWheel}
        handleStageMouseDown={handleStageMouseDown}
        handleStageMouseMove={handleStageMouseMove}
        handleStageMouseUp={handleStageMouseUp}
      />

      <InspectorPanel
        selectedNode={selectedNode}
        updateNodeProperty={updateNodeProperty}
        duplicateShape={() => duplicateShape(selectedId)}
        deleteShape={() => deleteShape(selectedId)}
      />

      <LoadingOverlay isLoading={isLoading} />
    </div>
  );
}
