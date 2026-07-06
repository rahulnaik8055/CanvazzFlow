"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Konva from "konva";
import { useParams, useRouter } from "next/navigation";
import { useApi } from "@/lib/api";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";

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
import { useSnapping } from "@/hooks/useSnapping";
import { useAlignment } from "@/hooks/useAlignment";
import InspectorPanel from "@/components/InspectorPanel";
import CanvasArea from "@/components/CanvasArea";
import LeftSidebar from "@/components/LeftSidebar";
import TopToolbar from "@/components/TopToolbar";
import CollaboratorCursors from "@/components/editor/CollaboratorCursors";
import { RequestAccessModal } from "@/components/requests/RequestAccessModal";
import { AccessRequestBanner } from "@/components/common/AccessRequestBanner";

type Role = "owner" | "editor" | "viewer";

export default function EditorPage() {
  const { pageId, projectId } = useParams<{
    pageId: string;
    projectId: string;
  }>();
  const api = useApi();
  const { userId } = useAuth();

  const [initialNodes, setInitialNodes] = useState<Node[] | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [projectName, setProjectName] = useState<string>("");
  const [accessState, setAccessState] = useState<
    "loading" | "granted" | "denied" | "error"
  >("loading");

  useEffect(() => {
    api
      .get(`project/${projectId}/pages/${pageId}/my-role`)
      .then(({ role }) => {
        setRole(role);
        return Promise.all([
          api.get(`pages/${pageId}/nodes`),
          api.get(`project/${projectId}`),
        ]);
      })
      .then(([nodes, project]) => {
        setInitialNodes(nodes);
        setProjectName(project.name);
        setAccessState("granted");
      })
      .catch((err) => {
        setAccessState(err?.status === 403 ? "denied" : "error");
        if (err?.status !== 403) {
          toast.error("Failed to load canvas data");
        }
      });
  }, [pageId, projectId]);

  if (accessState === "loading") return <LoadingOverlay isLoading />;

  if (accessState === "error") {
    return (
      <div className="flex h-screen items-center justify-center text-sm text-gray-400">
        Failed to load canvas.
      </div>
    );
  }

  if (accessState === "denied") {
    return (
      <NoAccessScreen
        projectId={projectId}
        projectName={projectName}
        currentUserId={userId!}
      />
    );
  }

  return (
    <RoomProvider
      id={`page-${pageId}`}
      initialPresence={{
        cursor: null,
        selectedId: null,
        userName: "Anonymous",
      }}
      initialStorage={{
        nodes: new LiveMap(initialNodes!.map((n) => [n.id, n])),
      }}
    >
      <Editor projectId={projectId} role={role!} canEdit={role !== "viewer"} />
    </RoomProvider>
  );
}

function NoAccessScreen({
  projectId,
  projectName,
  currentUserId,
}: {
  projectId: string;
  projectName: string;
  currentUserId: string;
}) {
  const router = useRouter();

  return (
    <div className="flex h-screen flex-col items-center justify-center gap-4 bg-gray-50">
      <div className="flex flex-col items-center gap-2 text-center">
        <p className="text-sm font-medium text-gray-900">
          You don't have access to this canvas
        </p>
        <p className="text-xs text-gray-400">
          Ask the owner to invite you, or request access below.
        </p>
      </div>

      <RequestAccessModal
        projectId={projectId}
        projectName={projectName}
        currentUserId={currentUserId}
      />

      <button
        onClick={() => router.push("/dashboard")}
        className="rounded-lg bg-gray-900 px-4 py-2 text-xs text-white hover:bg-gray-700 transition-colors"
      >
        Go to dashboard
      </button>
    </div>
  );
}

interface EditorProps {
  projectId: string;
  role: Role;
  canEdit: boolean;
}

function Editor({ projectId, role, canEdit }: EditorProps) {
  const router = useRouter();

  const nodes =
    useStorage((root) =>
      root.nodes ? (Object.values(root.nodes) as Node[]) : ([] as Node[]),
    ) ?? [];

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tool, setTool] = useState<"select" | "pan">("select");
  const [stageScale, setStageScale] = useState(1);
  const [stagePosition, setStagePosition] = useState({ x: 0, y: 0 });
  const [isDraggingStage, setIsDraggingStage] = useState(false);
  const [lastPointerPosition, setLastPointerPosition] = useState({
    x: 0,
    y: 0,
  });
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [showGrid, setShowGrid] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [smartGuides, setSmartGuides] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const transformerRef = useRef<Konva.Transformer>(null);
  const stageRef = useRef<Konva.Stage>(null) as React.RefObject<Konva.Stage>;

  const status = useStatus();
  const saveIndicator =
    status === "connected"
      ? "Live"
      : status === "reconnecting"
        ? "Reconnecting"
        : "Connecting...";

  const [, updateMyPresence] = useMyPresence();
  const others = useOthers();

  const _upsertNode = useMutation(({ storage }, node: Node) => {
    storage.get("nodes").set(node.id, node);
  }, []);

  const _deleteNode = useMutation(({ storage }, id: string) => {
    storage.get("nodes").delete(id);
  }, []);

  const upsertNode = useCallback(
    (node: Node) => {
      if (canEdit) _upsertNode(node);
    },
    [canEdit, _upsertNode],
  );

  const deleteNode = useCallback(
    (id: string) => {
      if (canEdit) _deleteNode(id);
    },
    [canEdit, _deleteNode],
  );

  const syncSetNodes = useCallback(
    (updater: Node[] | ((prev: Node[]) => Node[])) => {
      if (!canEdit) return;

      const nextNodes =
        typeof updater === "function" ? updater(nodes) : updater;
      const prevMap = new Map(nodes.map((n) => [n.id, n]));
      const nextMap = new Map(nextNodes.map((n) => [n.id, n]));

      nextNodes.forEach((node) => {
        const prev = prevMap.get(node.id);
        if (!prev || JSON.stringify(prev) !== JSON.stringify(node)) {
          upsertNode(node);
        }
      });

      nodes.forEach((node) => {
        if (!nextMap.has(node.id)) deleteNode(node.id);
      });
    },
    [nodes, upsertNode, deleteNode, canEdit],
  );

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
      syncSetNodes,
      saveToHistory,
      stagePosition,
      canvasSize,
      stageScale,
      setSelectedId,
      setTool,
      setError,
    );

  const addShapeAndSync = useCallback(
    (...args: Parameters<typeof addShape>) => {
      if (!canEdit) return;
      addShape(...args);
    },
    [addShape, canEdit],
  );

  const deleteShapeAndSync = useCallback(
    (id: string | null) => {
      if (!id || !canEdit) return;
      deleteShape(id);
      deleteNode(id);
      setSelectedId(null);
      updateMyPresence({ selectedId: null });
    },
    [deleteShape, deleteNode, updateMyPresence, canEdit],
  );

  const duplicateShapeAndSync = useCallback(
    (id: string | null) => {
      if (!id || !canEdit) return;
      duplicateShape(id);
    },
    [duplicateShape, canEdit],
  );

  const updatePropertyAndSync = useCallback(
    (...args: Parameters<typeof updateNodeProperty>) => {
      if (!canEdit) return;
      updateNodeProperty(...args);
    },
    [updateNodeProperty, canEdit],
  );

  const { zoomIn, zoomOut, resetView } = useViewControls(
    setStageScale,
    setStagePosition,
  );

  const { guides, computeSnap, clearGuides, prepareSnapTargets } = useSnapping(
    snapToGrid,
    smartGuides,
  );

  const {
    alignLeft,
    alignCenterX,
    alignRight,
    alignTop,
    alignCenterY,
    alignBottom,
    distributeHorizontally,
    distributeVertically,
  } = useAlignment(nodes, syncSetNodes, saveToHistory);

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

  const handleDragStart = useCallback(
    (id: string) => {
      prepareSnapTargets(nodes, id);
    },
    [nodes, prepareSnapTargets],
  );

  const handleDragMove = useCallback(
    (id: string, e: Konva.KonvaEventObject<DragEvent>) => {
      if (!canEdit) return;
      const node = nodes.find((n) => n.id === id);
      if (!node) return;
      const snapped = computeSnap(
        { ...node, x: e.target.x(), y: e.target.y() },
        nodes,
      );
      e.target.position({ x: snapped.x, y: snapped.y });
    },
    [nodes, canEdit, computeSnap],
  );

  const handleDragAndSync = useCallback(
    (...args: Parameters<typeof handleDrag>) => {
      if (!canEdit) return;
      clearGuides();
      handleDrag(...args);
    },
    [handleDrag, canEdit, clearGuides],
  );

  const handleTransformEndAndSync = useCallback(
    (...args: Parameters<typeof handleTransformEnd>) => {
      if (!canEdit) return;
      handleTransformEnd(...args);
    },
    [handleTransformEnd, canEdit],
  );

  const handleSelectAndBroadcast = useCallback(
    (...args: Parameters<typeof handleSelect>) => {
      handleSelect(...args);
      updateMyPresence({ selectedId: args[0] as string | null });
    },
    [handleSelect, updateMyPresence],
  );

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

  useEffect(() => {
    if (!canEdit) return;

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
    canEdit,
    selectedId,
    historyUndo,
    historyRedo,
    syncSetNodes,
    duplicateShapeAndSync,
    deleteShapeAndSync,
  ]);

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
        canUndo={canEdit && historyStep > 0}
        canRedo={canEdit && historyStep < history.length - 1}
        saveIndicator={saveIndicator}
        role={role}
        onSave={() => {}}
        onBack={() => router.back()}
        selectedId={selectedId}
        canEdit={canEdit}
        alignment={{
          alignLeft,
          alignCenterX,
          alignRight,
          alignTop,
          alignCenterY,
          alignBottom,
          distributeHorizontally,
          distributeVertically,
        }}
      />

      <LeftSidebar
        showGrid={showGrid}
        setShowGrid={setShowGrid}
        snapToGrid={snapToGrid}
        setSnapToGrid={setSnapToGrid}
        smartGuides={smartGuides}
        setSmartGuides={setSmartGuides}
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
          handleDrag={canEdit ? handleDragAndSync : () => {}}
          handleDragStart={handleDragStart}
          handleDragMove={canEdit ? handleDragMove : () => {}}
          handleTransform={canEdit ? handleTransform : () => {}}
          handleTransformEnd={canEdit ? handleTransformEndAndSync : () => {}}
          handleWheel={handleWheel}
          handleStageMouseDown={handleStageMouseDown}
          handleStageMouseMove={handleMouseMoveForCursor}
          handleStageMouseUp={handleStageMouseUp}
          onMouseLeave={handleMouseLeaveForCursor}
          guides={guides}
        />

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
        canEdit={canEdit}
      />

      {role === "owner" && <AccessRequestBanner projectId={projectId} />}
    </div>
  );
}
