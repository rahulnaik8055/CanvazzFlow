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
  const [saving, setSaving] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<"saved" | "unsaved" | "saving">(
    "saved",
  );

  const transformerRef = useRef<Konva.Transformer>(null);
  const stageRef = useRef<Konva.Stage>(null) as React.RefObject<Konva.Stage>;
  const nodesRef = useRef<Node[]>([]); // always up to date nodes for beforeunload

  // keep nodesRef in sync
  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);

  // ─── Hooks ────────────────────────────────────────────────────
  const {
    saveToHistory,
    undo: historyUndo,
    redo: historyRedo,
    historyStep,
    history,
  } = useCanvasHistory(nodes);

  const {
    addShape,
    duplicateShape: actionsDuplicate,
    deleteShape: actionsDelete,
    updateNodeProperty,
  } = useShapeActions(
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

  // ─── Load nodes ───────────────────────────────────────────────
  useEffect(() => {
    const fetchNodes = async () => {
      setIsLoading(true);
      try {
        const data = await api.get(`pages/${pageId}/nodes`);
        setNodes(data);
        setSaveStatus("saved");
      } catch (err) {
        console.error("Failed to load nodes:", err);
        setError("Failed to load canvas.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchNodes();
  }, [pageId]);

  // ─── Core save function ───────────────────────────────────────
  const saveNodes = useCallback(
    async (nodesToSave: Node[]) => {
      setSaving(true);
      setSaveStatus("saving");
      try {
        const payload = nodesToSave.map(({ id, ...rest }) => rest);
        const saved = await api.post(`pages/${pageId}/nodes`, {
          nodes: payload,
        });
        setNodes(saved);
        setSaveStatus("saved");
      } catch (err) {
        console.error("Failed to save:", err);
        setError("Failed to save. Please try again.");
        setSaveStatus("unsaved");
      } finally {
        setSaving(false);
      }
    },
    [pageId],
  );

  // ─── Action-based save wrappers ───────────────────────────────
  // These wrap existing actions and save AFTER the action completes

  const addShapeAndSave = useCallback(
    async (...args: Parameters<typeof addShape>) => {
      addShape(...args);
      // addShape updates nodes internally — get updated state via callback
      setNodes((current) => {
        saveNodes(current);
        return current;
      });
    },
    [addShape, saveNodes],
  );

  const duplicateAndSave = useCallback(
    async (id: string | null) => {
      if (!id) return;
      actionsDuplicate(id);
      setNodes((current) => {
        saveNodes(current);
        return current;
      });
    },
    [actionsDuplicate, saveNodes],
  );

  const deleteAndSave = useCallback(
    async (id: string | null) => {
      if (!id) return;
      actionsDelete(id);
      setNodes((current) => {
        saveNodes(current);
        return current;
      });
    },
    [actionsDelete, saveNodes],
  );

  const updatePropertyAndSave = useCallback(
    async (...args: Parameters<typeof updateNodeProperty>) => {
      updateNodeProperty(...args);
      setNodes((current) => {
        saveNodes(current);
        return current;
      });
    },
    [updateNodeProperty, saveNodes],
  );

  // wrap transformEnd and dragEnd to save after user finishes interacting
  const handleTransformEndAndSave = useCallback(
    (...args: Parameters<typeof handleTransformEnd>) => {
      handleTransformEnd(...args);
      setNodes((current) => {
        saveNodes(current);
        return current;
      });
    },
    [handleTransformEnd, saveNodes],
  );

  const handleDragAndSave = useCallback(
    (...args: Parameters<typeof handleDrag>) => {
      handleDrag(...args);
      // only save on dragend, not during drag
      const event = args[0] as any;
      if (event?.type === "dragend") {
        setNodes((current) => {
          saveNodes(current);
          return current;
        });
      }
    },
    [handleDrag, saveNodes],
  );

  // ─── Save on page leave ───────────────────────────────────────
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (saveStatus === "unsaved") {
        saveNodes(nodesRef.current);
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [saveStatus, saveNodes]);

  // ─── Ctrl+S manual save ───────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case "s":
            e.preventDefault();
            saveNodes(nodesRef.current);
            break;
          case "z":
            e.preventDefault();
            if (e.shiftKey) historyRedo(setNodes, setSelectedId);
            else historyUndo(setNodes, setSelectedId);
            break;
          case "c":
            if (selectedId) {
              e.preventDefault();
              duplicateAndSave(selectedId);
            }
            break;
          case "Delete":
          case "Backspace":
            if (selectedId) {
              e.preventDefault();
              deleteAndSave(selectedId);
            }
            break;
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    selectedId,
    historyUndo,
    historyRedo,
    duplicateAndSave,
    deleteAndSave,
    saveNodes,
  ]);

  // ─── Canvas size ──────────────────────────────────────────────
  useEffect(() => {
    const updateCanvasSize = () => {
      setCanvasSize({
        width: Math.max(400, window.innerWidth - 520),
        height: Math.max(300, window.innerHeight - 60),
      });
    };
    updateCanvasSize();
    window.addEventListener("resize", updateCanvasSize);
    return () => window.removeEventListener("resize", updateCanvasSize);
  }, []);

  // ─── Transformer attachment ───────────────────────────────────
  useEffect(() => {
    if (
      tool === "select" &&
      selectedId &&
      transformerRef.current &&
      stageRef.current
    ) {
      const selectedKonvaNode = stageRef.current.findOne(`#${selectedId}`);
      if (selectedKonvaNode) {
        transformerRef.current.nodes([selectedKonvaNode]);
        transformerRef.current.getLayer()?.batchDraw();
      }
    }
  }, [selectedId, nodes, tool]);

  const selectedNode = nodes.find((n) => n.id === selectedId) || null;

  // save status indicator — same UI as original, just small text in toolbar
  const saveIndicator = saving
    ? "Saving..."
    : saveStatus === "unsaved"
      ? "Unsaved"
      : "Saved";

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
        saveIndicator={saveIndicator} // pass to TopToolbar to show status
        onSave={() => saveNodes(nodesRef.current)}
        onBack={() => router.back()}
      />

      <LeftSidebar
        showGrid={showGrid}
        setShowGrid={setShowGrid}
        error={error}
      />

      <CanvasArea
        addShape={addShapeAndSave}
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
        handleDrag={handleDragAndSave}
        handleTransform={handleTransform}
        handleTransformEnd={handleTransformEndAndSave}
        handleWheel={handleWheel}
        handleStageMouseDown={handleStageMouseDown}
        handleStageMouseMove={handleStageMouseMove}
        handleStageMouseUp={handleStageMouseUp}
      />

      <InspectorPanel
        selectedNode={selectedNode}
        updateNodeProperty={updatePropertyAndSave}
        duplicateShape={() => duplicateAndSave(selectedId)}
        deleteShape={() => deleteAndSave(selectedId)}
      />

      <LoadingOverlay isLoading={isLoading} />
    </div>
  );
}
