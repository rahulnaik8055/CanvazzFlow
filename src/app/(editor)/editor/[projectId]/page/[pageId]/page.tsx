"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Konva from "konva";
import { useParams, useRouter } from "next/navigation";
import { useApi } from "@/lib/api";
import { useAuth, useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import { getUserColor } from "@/lib/presence";
import { useIdleDetection } from "@/hooks/useIdleDetection";

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
  const visitedRef = useRef(false);
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

  useEffect(() => {
    if (visitedRef.current) return;
    visitedRef.current = true;
    api.post(`project/${projectId}/pages/${pageId}/visit`).catch(() => {});
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
        selectedName: null,
        userName: "Anonymous",
        userAvatar: "",
        userColor: "#4B9CF5",
        page: pageId,
        lastActive: Date.now(),
        isIdle: false,
      }}
      initialStorage={{
        nodes: new LiveMap(initialNodes!.map((n) => [n.id, n])),
      }}
    >
      <Editor projectId={projectId} pageId={pageId} role={role!} canEdit={role !== "viewer"} />
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
  pageId: string;
  role: Role;
  canEdit: boolean;
}

function Editor({ projectId, pageId, role, canEdit }: EditorProps) {
  const router = useRouter();
  const { user } = useUser();
  const api = useApi();

  const [members, setMembers] = useState<Array<{ id: string; firstName: string | null; lastName: string | null; email: string; imageUrl: string | null; role: string }>>([]);

  useEffect(() => {
    if (role !== "owner") return;
    api.get(`projects/${projectId}/members`).then((data: any[]) => {
      const unique = Array.from(new Map(data.map((m: any) => [m.id, m])).values());
      setMembers(unique);
    }).catch(() => {});
  }, [projectId, role]);

  const handleRoleChange = useCallback(async (userId: string, newRole: string) => {
    try {
      await api.patch(`projects/${projectId}/members/${userId}/role`, { role: newRole });
      setMembers((prev) => prev.map((m) => (m.id === userId ? { ...m, role: newRole } : m)));
      toast.success("Role updated");
    } catch {
      toast.error("Failed to update role");
    }
  }, [projectId]);

  const handleRemoveMember = useCallback(async (userId: string) => {
    try {
      await api.delete(`projects/${projectId}/members/${userId}`);
      setMembers((prev) => prev.filter((m) => m.id !== userId));
      toast.success("Member removed");
    } catch {
      toast.error("Failed to remove member");
    }
  }, [projectId]);

  const userName = user?.fullName || user?.emailAddresses?.[0]?.emailAddress || "Anonymous";
  const userAvatar = user?.imageUrl || "";
  const userColor = getUserColor(user?.id || projectId);

  const nodes =
    useStorage((root) =>
      root.nodes ? (Object.values(root.nodes) as Node[]) : ([] as Node[]),
    ) ?? [];

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [tool, setTool] = useState<"select" | "pan">("select");
  const [spaceHeld, setSpaceHeld] = useState(false);
  const effectiveTool: "select" | "pan" = spaceHeld ? "pan" : tool;
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

  // Broadcast deselection to collaborators whenever selectedIds becomes empty
  useEffect(() => {
    if (selectedIds.length === 0) {
      updateMyPresence({ selectedId: null, selectedName: null });
    }
  }, [selectedIds, updateMyPresence]);

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
      setSelectedIds,
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
    (ids: string[]) => {
      if (ids.length === 0 || !canEdit) return;
      deleteShape(ids);
      ids.forEach((id) => deleteNode(id));
      setSelectedIds([]);
      updateMyPresence({ selectedId: null, selectedName: null });
    },
    [deleteShape, deleteNode, updateMyPresence, canEdit],
  );

  const duplicateShapeAndSync = useCallback(
    (ids: string[]) => {
      if (ids.length === 0 || !canEdit) return;
      duplicateShape(ids);
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
    handleDragStart: hookDragStart,
    handleTransform,
    handleTransformEnd,
    handleWheel,
    handleStageMouseDown,
    handleStageMouseMove,
    handleStageMouseUp,
    selectionRect,
  } = useCanvasInteractions(
    nodes,
    syncSetNodes,
    saveToHistory,
    setSelectedIds,
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
    effectiveTool,
    selectedIds,
    canEdit,
  );

  const handleDragStart = useCallback(
    (id: string) => {
      hookDragStart(id);
      prepareSnapTargets(nodes, id);
    },
    [hookDragStart, nodes, prepareSnapTargets],
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
    (id: string | null, metaKey?: boolean, shiftKey?: boolean) => {
      handleSelect(id, metaKey, shiftKey);
      const selectedName = id
        ? nodes.find((n) => n.id === id)?.name ?? null
        : null;
      updateMyPresence({ selectedId: id, selectedName });
    },
    [handleSelect, updateMyPresence, nodes],
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

  // Space-hold for temporary pan (Figma-like)
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.code === "Space" && !e.repeat) {
        e.preventDefault();
        setSpaceHeld(true);
      }
    };
    const up = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        setSpaceHeld(false);
      }
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  useEffect(() => {
    if (!canEdit) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        e.preventDefault();
        if (e.shiftKey) historyRedo(syncSetNodes, setSelectedIds);
        else historyUndo(syncSetNodes, setSelectedIds);
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key === "c") {
        if (selectedIds.length > 0) {
          e.preventDefault();
          duplicateShapeAndSync(selectedIds);
        }
        return;
      }

      if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedIds.length > 0) {
          e.preventDefault();
          deleteShapeAndSync(selectedIds);
        }
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    canEdit,
    selectedIds,
    historyUndo,
    historyRedo,
    syncSetNodes,
    duplicateShapeAndSync,
    deleteShapeAndSync,
  ]);

  useEffect(() => {
    const update = () =>
      setCanvasSize({
        width: Math.max(400, window.innerWidth - 548),
        height: Math.max(300, window.innerHeight - 56),
      });
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  useIdleDetection(
    useCallback(
      (isIdle: boolean) => {
        updateMyPresence({
          isIdle,
          lastActive: Date.now(),
        });
      },
      [updateMyPresence],
    ),
    useCallback(() => {
      updateMyPresence({
        lastActive: Date.now(),
      });
    }, [updateMyPresence]),
  );

  useEffect(() => {
    updateMyPresence({
      userName,
      userAvatar,
      userColor,
      page: pageId,
      lastActive: Date.now(),
      isIdle: false,
      selectedId: null,
      selectedName: null,
    });
  }, [updateMyPresence, userName, userAvatar, userColor, pageId]);

  useEffect(() => {
    if (
      effectiveTool === "select" &&
      selectedIds.length > 0 &&
      transformerRef.current &&
      stageRef.current
    ) {
      const stage = stageRef.current;
      const nodesToTransform = selectedIds
        .map((id) => stage.findOne(`#${id}`))
        .filter(Boolean) as Konva.Node[];
      if (nodesToTransform.length > 0) {
        transformerRef.current.nodes(nodesToTransform);
        transformerRef.current.getLayer()?.batchDraw();
      }
    } else if (selectedIds.length === 0 && transformerRef.current) {
      transformerRef.current.nodes([]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [selectedIds, nodes, effectiveTool]);

  const selectedNode = selectedIds.length === 1
    ? nodes.find((n) => n.id === selectedIds[0]) || null
    : null;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-gray-50 font-sans">
      <TopToolbar
        tool={tool}
        setTool={setTool}
        undo={() => historyUndo(syncSetNodes, setSelectedIds)}
        redo={() => historyRedo(syncSetNodes, setSelectedIds)}
        canUndo={canEdit && historyStep > 0}
        canRedo={canEdit && historyStep < history.length - 1}
        saveIndicator={saveIndicator}
        role={role}
        onSave={() => {}}
        onBack={() => router.back()}
        selectedIds={selectedIds}
        canEdit={canEdit}
        others={others as any[]}
        currentUser={{
          name: userName,
          avatar: userAvatar,
          color: userColor,
        }}
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
        projectId={projectId}
        members={members.length > 0 ? members : undefined}
        onRoleChange={handleRoleChange}
        onRemoveMember={handleRemoveMember}
      />

      <LeftSidebar
        showGrid={showGrid}
        setShowGrid={setShowGrid}
        snapToGrid={snapToGrid}
        setSnapToGrid={setSnapToGrid}
        smartGuides={smartGuides}
        setSmartGuides={setSmartGuides}
        error={error}
        nodes={nodes}
        selectedIds={selectedIds}
        setSelectedIds={setSelectedIds}
        updateNodeProperty={updatePropertyAndSync}
        setNodes={syncSetNodes}
        saveToHistory={saveToHistory}
        canEdit={canEdit}
      />

      <div className="flex-1 flex flex-col" style={{ position: "relative" }}>
        <CanvasArea
          addShape={addShapeAndSync}
          nodes={nodes}
          canvasSize={canvasSize}
          stageScale={stageScale}
          stagePosition={stagePosition}
          showGrid={showGrid}
          selectedIds={selectedIds}
          tool={effectiveTool}
          zoomIn={zoomIn}
          zoomOut={zoomOut}
          resetView={resetView}
          stageRef={stageRef}
          transformerRef={transformerRef}
          handleSelect={handleSelectAndBroadcast}
          handleDrag={canEdit ? handleDragAndSync : () => {}}
          handleDragStart={canEdit ? handleDragStart : () => {}}
          handleDragMove={canEdit ? handleDragMove : () => {}}
          handleTransform={canEdit ? handleTransform : () => {}}
          handleTransformEnd={canEdit ? handleTransformEndAndSync : () => {}}
          canEdit={canEdit}
          handleWheel={handleWheel}
          handleStageMouseDown={handleStageMouseDown}
          handleStageMouseMove={handleMouseMoveForCursor}
          handleStageMouseUp={handleStageMouseUp}
          onMouseLeave={handleMouseLeaveForCursor}
          guides={guides}
          selectionRect={selectionRect}
          collaboratorSelections={(others as any[])?.map((o: any) => ({
            connectionId: o.connectionId,
            color: o.presence.userColor || "#4B9CF5",
            selectedId: o.presence.selectedId || null,
          }))}
        />

        <CollaboratorCursors
          others={others as any}
          nodes={nodes}
          stageScale={stageScale}
          stagePosition={stagePosition}
        />
      </div>

      <InspectorPanel
        selectedNode={selectedNode}
        updateNodeProperty={updatePropertyAndSync}
        duplicateShape={() => duplicateShapeAndSync(selectedIds)}
        deleteShape={() => deleteShapeAndSync(selectedIds)}
        canEdit={canEdit}
      />

      {role === "owner" && <AccessRequestBanner projectId={projectId} />}
    </div>
  );
}
