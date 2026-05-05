/**
 * EditorPage.tsx
 *
 * What changed from the sync engine version:
 *
 * REMOVED:
 *   - useSyncEngine entirely
 *   - all PATCH API calls from the frontend
 *   - nodesRef, prevNodesRef, delta diff useEffect
 *   - debounce timer, FSM state
 *
 * ADDED:
 *   - RoomProvider wrapping the whole editor
 *   - useStorage to read nodes from Liveblocks
 *   - useMutation to write nodes to Liveblocks
 *   - useMyPresence for cursor broadcasting
 *   - useOthers to render everyone else's cursors
 *
 * The save flow is now:
 *   user action → useMutation → Liveblocks → broadcasts to all users
 *   room empties → Liveblocks webhook → your backend → Postgres
 */

"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Konva from "konva";
import { useParams, useRouter } from "next/navigation";
import { useApi } from "@/lib/api";

import {
  RoomProvider,
  useStorage,
  useMutation,
  useMyPresence,
  useOthers,
  useStatus,
} from "@/liveblocks.config";
import { LiveMap } from "@liveblocks/client";
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
import CollaboratorCursors from "@/components/editor/CollaboratorCursors";

// ─── Root — loads nodes then mounts the room ──────────────────────────────────

export default function EditorPage() {
  const { pageId } = useParams<{ pageId: string }>();
  const api = useApi();

  const [initialNodes, setInitialNodes] = useState<Node[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Load nodes from Postgres first.
  // Once we have them, we pass them into the RoomProvider as initialStorage.
  // Liveblocks will use them to seed the shared document for this session.
  useEffect(() => {
    api
      .get(`pages/${pageId}/nodes`)
      .then(setInitialNodes)
      .catch(() => setLoadError("Failed to load canvas."));
  }, [pageId]);

  if (loadError) return <div>{loadError}</div>;
  if (!initialNodes) return <LoadingOverlay isLoading />;

  return (
    <RoomProvider
      id={`page-${pageId}`}
      initialPresence={{
        cursor: null,
        selectedId: null,
        userName: "Anonymous",
      }}
      initialStorage={{
        // Convert the flat array from Postgres into a LiveMap keyed by node id.
        // LiveMap is Liveblocks' collaborative Map — every mutation to it
        // is automatically synced to all users in the room instantly.
        nodes: new LiveMap(initialNodes.map((n) => [n.id, n])),
      }}
    >
      <Editor pageId={pageId} />
    </RoomProvider>
  );
}

// ─── Editor — the actual canvas, now reading from Liveblocks ─────────────────

function Editor({ pageId }: { pageId: string }) {
  const router = useRouter();

  // Read nodes directly from Liveblocks shared storage.
  // This re-renders whenever any user in the room changes any node.
  // No polling, no websocket management — Liveblocks handles it.

  // Convert LiveMap → array for Konva (which expects an array)
  const nodes =
    useStorage((root) =>
      root.nodes ? (Object.values(root.nodes) as Node[]) : ([] as Node[]),
    ) ?? [];

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tool, setTool] = useState<"select" | "pan">("select");
  const [stageScale, setStageScale] = useState<number>(1);
  const [stagePosition, setStagePosition] = useState({ x: 0, y: 0 });
  const [isDraggingStage, setIsDraggingStage] = useState(false);
  const [lastPointerPosition, setLastPointerPosition] = useState({
    x: 0,
    y: 0,
  });
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [showGrid, setShowGrid] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const transformerRef = useRef<Konva.Transformer>(null);
  const stageRef = useRef<Konva.Stage>(null) as React.RefObject<Konva.Stage>;

  // Connection status — show "Connecting..." while Liveblocks is establishing
  const status = useStatus();
  const saveIndicator =
    status === "connected"
      ? "Live"
      : status === "reconnecting"
        ? "Reconnecting"
        : "Connecting...";

  // My presence — broadcasts my cursor position and selection to others
  const [, updateMyPresence] = useMyPresence();

  // Others' presence — render their cursors on the canvas
  const others = useOthers();

  // ─── Liveblocks mutations ──────────────────────────────────────────────────
  //
  // useMutation gives us a function that writes to shared Storage.
  // Every call is:
  //   1. Applied locally immediately (optimistic)
  //   2. Broadcast to all other users in the room
  //   3. Confirmed by Liveblocks server
  //
  // This replaces every api.patch() call from the sync engine.

  const upsertNode = useMutation(({ storage }, node: Node) => {
    storage.get("nodes").set(node.id, node);
  }, []);

  const deleteNode = useMutation(({ storage }, id: string) => {
    storage.get("nodes").delete(id);
  }, []);

  // ─── Shape actions — now call Liveblocks mutations ─────────────────────────

  const {
    saveToHistory,
    undo: historyUndo,
    redo: historyRedo,
    historyStep,
    history,
  } = useCanvasHistory(nodes);

  // useShapeActions still manages local state for the canvas,
  // but after each action we also push to Liveblocks so other users see it.
  // We pass a no-op setNodes since nodes now come from Liveblocks storage.
  // Replace noopSetNodes with this
  const syncSetNodes = useCallback(
    (updater: Node[] | ((prev: Node[]) => Node[])) => {
      // resolve the new state — useShapeActions sometimes passes a function
      const nextNodes =
        typeof updater === "function" ? updater(nodes) : updater;

      const prevMap = new Map(nodes.map((n) => [n.id, n]));
      const nextMap = new Map(nextNodes.map((n) => [n.id, n]));

      // upsert anything added or changed
      nextNodes.forEach((node) => {
        const prev = prevMap.get(node.id);
        if (!prev || JSON.stringify(prev) !== JSON.stringify(node)) {
          upsertNode(node);
        }
      });

      // delete anything removed
      nodes.forEach((node) => {
        if (!nextMap.has(node.id)) deleteNode(node.id);
      });
    },
    [nodes, upsertNode, deleteNode],
  );

  const { addShape, duplicateShape, deleteShape, updateNodeProperty } =
    useShapeActions(
      nodes,
      syncSetNodes,
      saveToHistory,
      stagePosition,
      canvasSize,
      stageScale,
      setSelectedId,
      setTool,
      setError,
    );

  // Wrap each action to also push the result to Liveblocks.
  // After the local action runs, we sync the affected nodes.

  const addShapeAndSync = useCallback(
    (...args: Parameters<typeof addShape>) => {
      addShape(...args);
      // addShape internally creates a new node — we need to find it
      // The cleanest way is to return the new node from addShape (refactor if needed)
      // For now: sync all nodes after a short yield
      setTimeout(() => nodes.forEach(upsertNode), 0);
    },
    [addShape, nodes, upsertNode],
  );

  const deleteShapeAndSync = useCallback(
    (id: string | null) => {
      if (!id) return;
      deleteShape(id);
      deleteNode(id);
      setSelectedId(null);
      updateMyPresence({ selectedId: null });
    },
    [deleteShape, deleteNode, updateMyPresence],
  );

  const duplicateShapeAndSync = useCallback(
    (id: string | null) => {
      if (!id) return;
      duplicateShape(id);
      setTimeout(() => nodes.forEach(upsertNode), 0);
    },
    [duplicateShape, nodes, upsertNode],
  );

  const updatePropertyAndSync = useCallback(
    (...args: Parameters<typeof updateNodeProperty>) => {
      updateNodeProperty(...args);
      const [id] = args;
      const updated = nodes.find((n) => n.id === id);
      if (updated) upsertNode(updated);
    },
    [updateNodeProperty, nodes, upsertNode],
  );

  // ─── Canvas interactions ───────────────────────────────────────────────────

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
    syncSetNodes,
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

  // On dragend, push moved node positions to Liveblocks
  const handleDragAndSync = useCallback(
    (...args: Parameters<typeof handleDrag>) => {
      handleDrag(...args);
      const event = args[0] as any;
      if (event?.type === "dragend") {
        setTimeout(() => nodes.forEach(upsertNode), 0);
      }
    },
    [handleDrag, nodes, upsertNode],
  );

  // On transform end, push resized/rotated node to Liveblocks
  const handleTransformEndAndSync = useCallback(
    (...args: Parameters<typeof handleTransformEnd>) => {
      handleTransformEnd(...args);
      setTimeout(() => nodes.forEach(upsertNode), 0);
    },
    [handleTransformEnd, nodes, upsertNode],
  );

  // ─── Selection presence ────────────────────────────────────────────────────
  // Broadcast my selected shape to other users so they can see what I have selected

  const handleSelectAndBroadcast = useCallback(
    (...args: Parameters<typeof handleSelect>) => {
      handleSelect(...args);
      const id = args[0] as string | null;
      updateMyPresence({ selectedId: id });
    },
    [handleSelect, updateMyPresence],
  );

  // ─── Cursor presence ───────────────────────────────────────────────────────
  // Broadcast my cursor position to others on every mouse move

  const handleMouseMoveForCursor = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      const pos = e.target.getStage()?.getPointerPosition();
      if (pos) updateMyPresence({ cursor: pos });
      handleStageMouseMove(e);
    },
    [handleStageMouseMove, updateMyPresence],
  );

  const handleMouseLeaveForCursor = useCallback(() => {
    updateMyPresence({ cursor: null });
  }, [updateMyPresence]);

  // ─── Keyboard shortcuts ────────────────────────────────────────────────────

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      switch (e.key) {
        case "z":
          e.preventDefault();
          if (e.shiftKey) historyRedo(syncSetNodes, setSelectedId);
          else historyUndo(syncSetNodes, setSelectedId);
          break;
        case "c":
          if (selectedId) {
            e.preventDefault();
            duplicateShapeAndSync(selectedId);
          }
          break;
        case "Delete":
        case "Backspace":
          if (selectedId) {
            e.preventDefault();
            deleteShapeAndSync(selectedId);
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
    duplicateShapeAndSync,
    deleteShapeAndSync,
  ]);

  // ─── Canvas size ───────────────────────────────────────────────────────────

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

  // ─── Transformer ───────────────────────────────────────────────────────────

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

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-gray-50 font-sans">
      <TopToolbar
        tool={tool}
        setTool={setTool}
        undo={() => historyUndo(syncSetNodes, setSelectedId)}
        redo={() => historyRedo(syncSetNodes, setSelectedId)}
        zoomIn={zoomIn}
        zoomOut={zoomOut}
        resetView={resetView}
        stageScale={stageScale}
        canUndo={historyStep > 0}
        canRedo={historyStep < history.length - 1}
        saveIndicator={saveIndicator}
        onSave={() => {}} // no manual save needed — Liveblocks + webhook handles it
        onBack={() => router.back()}
      />

      <LeftSidebar
        showGrid={showGrid}
        setShowGrid={setShowGrid}
        error={error}
      />

      <div style={{ position: "relative" }}>
        <CanvasArea
          addShape={addShapeAndSync}
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
          handleSelect={handleSelectAndBroadcast}
          handleDrag={handleDragAndSync}
          handleTransform={handleTransform}
          handleTransformEnd={handleTransformEndAndSync}
          handleWheel={handleWheel}
          handleStageMouseDown={handleStageMouseDown}
          handleStageMouseMove={handleMouseMoveForCursor}
          handleStageMouseUp={handleStageMouseUp}
          onMouseLeave={handleMouseLeaveForCursor}
        />

        {/* Render other users' cursors on top of the canvas */}
        <CollaboratorCursors
          others={others}
          stageScale={stageScale}
          stagePosition={stagePosition}
        />
      </div>

      <InspectorPanel
        selectedNode={selectedNode}
        updateNodeProperty={updatePropertyAndSync}
        duplicateShape={() => duplicateShapeAndSync(selectedId)}
        deleteShape={() => deleteShapeAndSync(selectedId)}
      />
    </div>
  );
}
