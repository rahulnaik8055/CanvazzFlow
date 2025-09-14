import { useCallback } from "react";
import { Node } from "@/types/CanvasTypes";
import { generateId, calculateShapeCenter } from "@/lib/canvasUtils";

export const useShapeActions = (
  nodes: Node[],
  setNodes: (nodes: Node[]) => void,
  saveToHistory: (newNodes: Node[]) => void,
  stagePosition: { x: number; y: number },
  canvasSize: { width: number; height: number },
  stageScale: number,
  setSelectedId: (id: string | null) => void,
  setTool: (tool: "select" | "pan") => void,
  setError: (error: string | null) => void
) => {
  const addShape = useCallback(
    (type: "rect" | "circle" | "text") => {
      try {
        setError(null);
        const { x, y } = calculateShapeCenter(
          stagePosition,
          canvasSize,
          stageScale
        );
        const maxZIndex =
          nodes.length > 0 ? Math.max(...nodes.map((n) => n.zIndex)) : 0;

        const newNode: Node = {
          id: generateId(),
          type,
          x,
          y,
          width: type === "text" ? 120 : 120,
          height: type === "text" ? 40 : 80,
          radius: type === "circle" ? 50 : 0,
          text: type === "text" ? "Sample Text" : "",
          fill: type === "text" ? "#1f2937" : "#3b82f6",
          stroke: "#1e40af",
          strokeWidth: 2,
          rotation: 0,
          opacity: 1,
          fontSize: 16,
          fontFamily: "Inter, system-ui, sans-serif",
          zIndex: maxZIndex + 1,
        };

        const newNodes = [...nodes, newNode];
        setNodes(newNodes);
        saveToHistory(newNodes);
        setSelectedId(newNode.id);
        setTool("select");
      } catch (err) {
        setError("Failed to add shape. Please try again.");
        console.error("Error adding shape:", err);
      }
    },
    [
      nodes,
      stagePosition,
      canvasSize,
      stageScale,
      setNodes,
      saveToHistory,
      setSelectedId,
      setTool,
      setError,
    ]
  );

  const duplicateShape = useCallback(
    (selectedId: string | null) => {
      if (selectedId) {
        const selectedNode = nodes.find((n) => n.id === selectedId);
        if (selectedNode) {
          const maxZIndex =
            nodes.length > 0 ? Math.max(...nodes.map((n) => n.zIndex)) : 0;
          const newNode: Node = {
            ...selectedNode,
            id: generateId(),
            x: selectedNode.x + 20,
            y: selectedNode.y + 20,
            zIndex: maxZIndex + 1,
          };
          const newNodes = [...nodes, newNode];
          setNodes(newNodes);
          saveToHistory(newNodes);
          setSelectedId(newNode.id);
        }
      }
    },
    [nodes, setNodes, saveToHistory, setSelectedId]
  );

  const deleteShape = useCallback(
    (selectedId: string | null) => {
      if (selectedId) {
        const newNodes = nodes.filter((n) => n.id !== selectedId);
        setNodes(newNodes);
        saveToHistory(newNodes);
        setSelectedId(null);
      }
    },
    [nodes, setNodes, saveToHistory, setSelectedId]
  );

  const updateNodeProperty = useCallback(
    (id: string, property: keyof Node, value: any) => {
      const newNodes = nodes.map((n) =>
        n.id === id ? { ...n, [property]: value } : n
      );
      setNodes(newNodes);
      saveToHistory(newNodes);
    },
    [nodes, setNodes, saveToHistory]
  );

  return { addShape, duplicateShape, deleteShape, updateNodeProperty };
};
