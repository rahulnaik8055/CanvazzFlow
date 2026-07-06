import { useCallback } from "react";
import { Node } from "@/types/CanvasTypes";
import { generateId, calculateShapeCenter } from "@/lib/canvasUtils";
import {
  FRAME_DEFAULT_STROKE,
  FRAME_DEFAULT_STROKE_WIDTH,
  FRAME_DEFAULT_STROKE_STYLE,
} from "@/constants/CanvasConstants";

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
    async (
      type: "rect" | "circle" | "text" | "frame" | "star" | "diamond" | "image",
      file?: File,
    ) => {
      try {
        setError(null);
        const { x, y } = calculateShapeCenter(
          stagePosition,
          canvasSize,
          stageScale,
        );
        const maxZIndex =
          nodes.length > 0 ? Math.max(...nodes.map((n) => n.zIndex)) : 0;

        let newNode: Node;

        if (type === "frame") {
          newNode = {
            id: generateId(),
            type,
            x,
            y,
            width: 150,
            height: 100,
            radius: 0,
            text: "",
            fill: "#fff",
            stroke: FRAME_DEFAULT_STROKE,
            strokeWidth: FRAME_DEFAULT_STROKE_WIDTH,
            strokeStyle: FRAME_DEFAULT_STROKE_STYLE,
            rotation: 0,
            opacity: 1,
            fontSize: 16,
            fontFamily: "Inter, system-ui, sans-serif",
            zIndex: maxZIndex + 1,
            visible: true,
            locked: false,
            name: "Frame",
            parentId: null,
          };
        } else if (type === "image" && file) {
          const imageUrl = URL.createObjectURL(file);
          await new Promise((resolve, reject) => {
            const img = new window.Image();
            img.src = imageUrl;
            img.onload = resolve;
            img.onerror = () => reject(new Error("Failed to load image"));
          });
          newNode = {
            id: generateId(),
            type,
            x,
            y,
            width: 200,
            height: 200,
            radius: 0,
            text: "",
            fill: "transparent",
            stroke: "#ffffff",
            strokeWidth: 2,
            rotation: 0,
            opacity: 1,
            fontSize: 16,
            fontFamily: "Inter, system-ui, sans-serif",
            zIndex: maxZIndex + 1,
            imageUrl,
            visible: true,
            locked: false,
            name: "Image",
            parentId: null,
          };
        } else {
          const typeLabel =
            type === "rect" ? "Rectangle" :
            type === "circle" ? "Ellipse" :
            type === "text" ? "Text" :
            type === "star" ? "Star" :
            type === "diamond" ? "Diamond" : "Shape";

          newNode = {
            id: generateId(),
            type,
            x,
            y,
            width:
              type === "text"
                ? 120
                : type === "star" || type === "diamond"
                  ? 100
                  : 120,
            height:
              type === "text"
                ? 40
                : type === "star" || type === "diamond"
                  ? 100
                  : 80,
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
            visible: true,
            locked: false,
            name: typeLabel,
            parentId: null,
          };
        }

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
    [
      nodes,
      stagePosition,
      canvasSize,
      stageScale,
      setNodes,
      saveToHistory,
      setSelectedIds,
      setTool,
      setError,
    ],
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
          name: node.name ? `${node.name} copy` : undefined,
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

  return { addShape, duplicateShape, deleteShape, updateNodeProperty };
};
