// /app/editor/page.tsx
"use client";

import React, { useState, useRef, useEffect } from "react";
import Konva from "konva";

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

export default function ProfessionalCanvasEditor() {
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
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const transformerRef = useRef<Konva.Transformer>(null);
  const stageRef = useRef<Konva.Stage>(null) as React.RefObject<Konva.Stage>;

  // Hooks
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
    setError
  );

  const { zoomIn, zoomOut, resetView } = useViewControls(
    setStageScale,
    setStagePosition
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
    tool
  );

  // Canvas size effect
  useEffect(() => {
    const updateCanvasSize = () => {
      const width = window.innerWidth - 520; // Sidebar + Inspector width
      const height = window.innerHeight - 60; // Header height
      setCanvasSize({
        width: Math.max(400, width),
        height: Math.max(300, height),
      });
    };

    updateCanvasSize();
    window.addEventListener("resize", updateCanvasSize);
    return () => window.removeEventListener("resize", updateCanvasSize);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case "z":
            e.preventDefault();
            if (e.shiftKey) {
              historyRedo(setNodes, setSelectedId);
            } else {
              historyUndo(setNodes, setSelectedId);
            }
            break;
          case "c":
            if (selectedId) {
              e.preventDefault();
              actionsDuplicate(selectedId);
            }
            break;
          case "Delete":
          case "Backspace":
            if (selectedId) {
              e.preventDefault();
              actionsDelete(selectedId);
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
    actionsDuplicate,
    actionsDelete,
    setNodes,
    setSelectedId,
  ]);

  // Transformer attachment
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
        handleDrag={handleDrag}
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
        duplicateShape={() => actionsDuplicate(selectedId)}
        deleteShape={() => actionsDelete(selectedId)}
      />

      <LoadingOverlay isLoading={isLoading} />
    </div>
  );
}
