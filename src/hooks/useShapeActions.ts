import { useCallback } from "react";
import { Node, ShapeType } from "@/types/CanvasTypes";
import { generateId, calculateShapeCenter, createDefaultNode } from "@/lib/canvasUtils";

export const useShapeActions = (
  nodes: Node[],
  setNodes: (nodes: Node[]) => void,
  saveToHistory: (newNodes: Node[]) => void,
  stagePosition: { x: number; y: number },
  canvasSize: { width: number; height: number },
  stageScale: number,
  setSelectedIds: (ids: string[]) => void,
  setTool: (tool: "select" | "pan") => void,
  setError: (error: string | null) => void,
) => {
  const addShape = useCallback(
    (type: ShapeType) => {
      try {
        setError(null);
        const { x, y } = calculateShapeCenter(
          stagePosition,
          canvasSize,
          stageScale,
        );
        const maxZIndex =
          nodes.length > 0 ? Math.max(...nodes.map((n) => n.zIndex)) : 0;

        const newNode = createDefaultNode(type, x, y, maxZIndex);

        const newNodes = [...nodes, newNode];
        setNodes(newNodes);
        saveToHistory(newNodes);
        setSelectedIds([newNode.id]);
        setTool("select");
      } catch (err) {
        setError("Failed to add shape. Please try again.");
        console.error("Error adding shape:", err);
      }
    },
    [nodes, stagePosition, canvasSize, stageScale, setNodes, saveToHistory, setSelectedIds, setTool, setError],
  );

  const duplicateShape = useCallback(
    (selectedIds: string[]) => {
      if (selectedIds.length === 0) return;
      const maxZIndex =
        nodes.length > 0 ? Math.max(...nodes.map((n) => n.zIndex)) : 0;
      const newNodes = [...nodes];
      const newIds: string[] = [];

      selectedIds.forEach((id) => {
        const node = nodes.find((n) => n.id === id);
        if (!node) return;
        const newId = generateId();
        newIds.push(newId);
        newNodes.push({
          ...node,
          id: newId,
          name: node.name ? `${node.name} copy` : node.name,
          x: node.x + 20,
          y: node.y + 20,
          zIndex: maxZIndex + 1 + newIds.length,
        });
      });

      setNodes(newNodes);
      saveToHistory(newNodes);
      setSelectedIds(newIds);
    },
    [nodes, setNodes, saveToHistory, setSelectedIds],
  );

  const deleteShape = useCallback(
    (selectedIds: string[]) => {
      if (selectedIds.length === 0) return;
      const idSet = new Set(selectedIds);
      const newNodes = nodes.filter((n) => !idSet.has(n.id));
      setNodes(newNodes);
      saveToHistory(newNodes);
      setSelectedIds([]);
    },
    [nodes, setNodes, saveToHistory, setSelectedIds],
  );

  const updateNodeProperty = useCallback(
    (id: string, property: keyof Node, value: any) => {
      const newNodes = nodes.map((n) =>
        n.id === id ? { ...n, [property]: value } : n,
      );
      setNodes(newNodes);
      saveToHistory(newNodes);
    },
    [nodes, setNodes, saveToHistory],
  );

  const bringForward = useCallback(
    (selectedIds: string[]) => {
      if (selectedIds.length === 0) return;
      const newNodes = nodes.map((n) => {
        if (!selectedIds.includes(n.id)) return n;
        const maxAbove = Math.max(
          ...nodes
            .filter((m) => !selectedIds.includes(m.id) && m.zIndex > n.zIndex)
            .map((m) => m.zIndex),
          n.zIndex,
        );
        return maxAbove > n.zIndex ? { ...n, zIndex: maxAbove } : n;
      });
      setNodes(newNodes);
      saveToHistory(newNodes);
    },
    [nodes, setNodes, saveToHistory],
  );

  const sendBackward = useCallback(
    (selectedIds: string[]) => {
      if (selectedIds.length === 0) return;
      const newNodes = nodes.map((n) => {
        if (!selectedIds.includes(n.id)) return n;
        const minBelow = Math.min(
          ...nodes
            .filter((m) => !selectedIds.includes(m.id) && m.zIndex < n.zIndex)
            .map((m) => m.zIndex),
          n.zIndex,
        );
        return minBelow < n.zIndex ? { ...n, zIndex: minBelow } : n;
      });
      setNodes(newNodes);
      saveToHistory(newNodes);
    },
    [nodes, setNodes, saveToHistory],
  );

  const bringToFront = useCallback(
    (selectedIds: string[]) => {
      if (selectedIds.length === 0) return;
      const maxZ = nodes.length > 0 ? Math.max(...nodes.map((n) => n.zIndex)) : 0;
      const newNodes = nodes.map((n) =>
        selectedIds.includes(n.id) ? { ...n, zIndex: maxZ + 1 } : n,
      );
      setNodes(newNodes);
      saveToHistory(newNodes);
    },
    [nodes, setNodes, saveToHistory],
  );

  const sendToBack = useCallback(
    (selectedIds: string[]) => {
      if (selectedIds.length === 0) return;
      const minZ = nodes.length > 0 ? Math.min(...nodes.map((n) => n.zIndex)) : 0;
      const newNodes = nodes.map((n) =>
        selectedIds.includes(n.id) ? { ...n, zIndex: minZ - 1 } : n,
      );
      setNodes(newNodes);
      saveToHistory(newNodes);
    },
    [nodes, setNodes, saveToHistory],
  );

  const toggleLock = useCallback(
    (selectedIds: string[]) => {
      if (selectedIds.length === 0) return;
      const newNodes = nodes.map((n) =>
        selectedIds.includes(n.id) ? { ...n, locked: !n.locked } : n,
      );
      setNodes(newNodes);
      saveToHistory(newNodes);
    },
    [nodes, setNodes, saveToHistory],
  );

  const toggleVisibility = useCallback(
    (selectedIds: string[]) => {
      if (selectedIds.length === 0) return;
      const newNodes = nodes.map((n) =>
        selectedIds.includes(n.id) ? { ...n, visible: !n.visible } : n,
      );
      setNodes(newNodes);
      saveToHistory(newNodes);
    },
    [nodes, setNodes, saveToHistory],
  );

  return {
    addShape,
    duplicateShape,
    deleteShape,
    updateNodeProperty,
    bringForward,
    sendBackward,
    bringToFront,
    sendToBack,
    toggleLock,
    toggleVisibility,
  };
};
