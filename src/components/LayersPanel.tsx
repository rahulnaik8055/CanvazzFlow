"use client";

import React, { useState, useCallback, useRef, useMemo } from "react";
import { Node } from "@/types/CanvasTypes";
import {
  Eye,
  EyeOff,
  Lock,
  LockOpen,
  Search,
  Layers,
  ChevronRight,
  ChevronDown,
  Type,
  Circle,
  Square,
  Film,
  Star,
  Diamond,
  MousePointer,
} from "lucide-react";

interface LayersPanelProps {
  nodes: Node[];
  selectedIds: string[];
  setSelectedIds: (ids: string[] | ((prev: string[]) => string[])) => void;
  updateNodeProperty: (id: string, property: keyof Node, value: any) => void;
  setNodes: (nodes: Node[] | ((prev: Node[]) => Node[])) => void;
  saveToHistory: (nodes: Node[]) => void;
  canEdit: boolean;
}

function getMaxChildZIndex(list: Node[], parentId: string) {
  return list
    .filter((n) => n.parentId === parentId)
    .reduce((max, n) => Math.max(max, n.zIndex), 0);
}

const typeIcons: Record<string, React.ReactNode> = {
  rect: <Square size={11} />,
  circle: <Circle size={11} />,
  text: <Type size={11} />,
  frame: <Film size={11} />,
  star: <Star size={11} />,
  diamond: <Diamond size={11} />,
  image: <MousePointer size={11} />,
};

export default function LayersPanel({
  nodes,
  selectedIds,
  setSelectedIds,
  updateNodeProperty,
  setNodes,
  saveToHistory,
  canEdit,
}: LayersPanelProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());
  const draggedIdRef = useRef<string | null>(null);
  const [dropTarget, setDropTarget] = useState<{
    id: string;
    position: "before" | "after" | "inside";
  } | null>(null);

  const childrenMap = useMemo(() => {
    const map = new Map<string | null, Node[]>();
    nodes.forEach((node) => {
      const parent = node.parentId ?? null;
      if (!map.has(parent)) map.set(parent, []);
      map.get(parent)!.push(node);
    });
    map.forEach((children) => children.sort((a, b) => b.zIndex - a.zIndex));
    return map;
  }, [nodes]);

  const filteredNodeIds = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const q = searchQuery.toLowerCase();
    const matchSet = new Set<string>();
    const ancestors = new Set<string>();

    nodes.forEach((node) => {
      if ((node.name ?? node.type).toLowerCase().includes(q)) {
        matchSet.add(node.id);
        let pid = node.parentId;
        while (pid) {
          ancestors.add(pid);
          pid = nodes.find((n) => n.id === pid)?.parentId ?? null;
        }
      }
    });

    ancestors.forEach((id) => matchSet.add(id));
    return matchSet;
  }, [nodes, searchQuery]);

  const isVisible = useCallback(
    (nodeId: string) => {
      if (!filteredNodeIds) return true;
      return filteredNodeIds.has(nodeId);
    },
    [filteredNodeIds],
  );

  const toggleCollapse = useCallback((id: string) => {
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleSelect = useCallback(
    (id: string, shift?: boolean) => {
      if (shift) {
        setSelectedIds((prev) =>
          prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
        );
      } else {
        setSelectedIds([id]);
      }
    },
    [setSelectedIds],
  );

  const handleStartRename = useCallback(
    (id: string, currentName: string) => {
      setEditingId(id);
      setEditValue(currentName);
    },
    [],
  );

  const handleFinishRename = useCallback(() => {
    if (editingId && editValue.trim()) {
      updateNodeProperty(editingId, "name", editValue.trim());
    }
    setEditingId(null);
    setEditValue("");
  }, [editingId, editValue, updateNodeProperty]);

  const handleDragStart = useCallback(
    (e: React.DragEvent, id: string) => {
      draggedIdRef.current = id;
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", id);
    },
    [],
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent, id: string) => {
      e.preventDefault();
      e.stopPropagation();
      const rect = e.currentTarget.getBoundingClientRect();
      const y = e.clientY - rect.top;
      const h = rect.height;
      const children = childrenMap.get(id) ?? [];

      let position: "before" | "after" | "inside";
      if (y < h * 0.25) {
        position = "before";
      } else if (y > h * 0.75) {
        position = "after";
      } else if (children.length > 0 || canHaveChildren(id)) {
        position = "inside";
      } else if (y < h * 0.5) {
        position = "before";
      } else {
        position = "after";
      }

      setDropTarget({ id, position });
    },
    [childrenMap],
  );

  const handleDragLeave = useCallback(() => {
    setDropTarget(null);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const draggedId = draggedIdRef.current;
      if (!draggedId || !dropTarget || draggedId === dropTarget.id) {
        setDropTarget(null);
        draggedIdRef.current = null;
        return;
      }

      const draggedNode = nodes.find((n) => n.id === draggedId);
      const targetNode = nodes.find((n) => n.id === dropTarget.id);
      if (!draggedNode || !targetNode) {
        setDropTarget(null);
        draggedIdRef.current = null;
        return;
      }

      const newNodes = nodes.map((n) => ({ ...n }));
      const dragIdx = newNodes.findIndex((n) => n.id === draggedId);

      if (dropTarget.position === "inside") {
        newNodes[dragIdx] = {
          ...newNodes[dragIdx],
          parentId: dropTarget.id,
          zIndex: getMaxChildZIndex(newNodes, dropTarget.id) + 1,
        };
      } else {
        const newParentId =
          dropTarget.position === "before" || dropTarget.position === "after"
            ? targetNode.parentId ?? null
            : null;

        if (newParentId !== (draggedNode.parentId ?? null)) {
          newNodes[dragIdx] = { ...newNodes[dragIdx], parentId: newParentId };
        }

        const siblings = newNodes
          .filter((n) => (n.parentId ?? null) === newParentId)
          .sort((a, b) => b.zIndex - a.zIndex);

        const targetSiblingIdx = siblings.findIndex(
          (n) => n.id === dropTarget.id,
        );
        const draggedSiblingIdx = siblings.findIndex(
          (n) => n.id === draggedId,
        );

        const reordered =
          draggedSiblingIdx >= 0
            ? [
                ...siblings.slice(0, draggedSiblingIdx),
                ...siblings.slice(draggedSiblingIdx + 1),
              ]
            : [...siblings];

        const insertAt =
          dropTarget.position === "before" ? targetSiblingIdx : targetSiblingIdx + 1;
        const movedNode = reordered.find((n) => n.id === draggedId) ?? {
          ...draggedNode,
          parentId: newParentId,
        };
        const filtered = reordered.filter((n) => n.id !== draggedId);
        filtered.splice(
          Math.min(insertAt, filtered.length),
          0,
          movedNode,
        );

        filtered.forEach((n, i) => {
          const idx = newNodes.findIndex((nn) => nn.id === n.id);
          if (idx >= 0) {
            newNodes[idx] = { ...newNodes[idx], zIndex: filtered.length - i };
          }
        });
      }

      setNodes(newNodes);
      saveToHistory(newNodes);
      setDropTarget(null);
      draggedIdRef.current = null;
    },
    [nodes, dropTarget, setNodes, saveToHistory],
  );

  const canHaveChildren = useCallback((_id: string) => {
    return true;
  }, []);

  const renderNode = useCallback(
    (node: Node, depth: number) => {
      if (!isVisible(node.id)) return null;

      const children = childrenMap.get(node.id) ?? [];
      const isCollapsed = collapsedIds.has(node.id);
      const isSelected = selectedIds.includes(node.id);
      const isDropTarget = dropTarget?.id === node.id;
      const hasChildren = children.length > 0;

      const icon = typeIcons[node.type] ?? <Square size={11} />;

      return (
        <div key={node.id}>
          <div
            draggable={canEdit && !node.locked}
            onDragStart={(e) => handleDragStart(e, node.id)}
            onDragOver={(e) => handleDragOver(e, node.id)}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => handleSelect(node.id)}
            onDoubleClick={() =>
              canEdit &&
              handleStartRename(node.id, node.name ?? node.type)
            }
            className={`group flex items-center h-7 px-1 cursor-pointer text-[12px] transition-colors select-none
              ${isSelected
                ? "bg-blue-50 text-blue-700"
                : "text-gray-600 hover:bg-gray-50"
              }
              ${!canEdit ? "cursor-default" : ""}
              ${dropTarget && isDropTarget && dropTarget.position === "inside"
                ? "ring-1 ring-blue-400 ring-inset rounded"
                : ""
              }
            `}
            style={{ paddingLeft: `${12 + depth * 16}px` }}
          >
            <div className="flex items-center gap-0.5 shrink-0">
              {hasChildren ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleCollapse(node.id);
                  }}
                  className="p-0.5 rounded text-gray-400 hover:text-gray-600"
                >
                  {isCollapsed ? (
                    <ChevronRight size={12} />
                  ) : (
                    <ChevronDown size={12} />
                  )}
                </button>
              ) : (
                <div className="w-4" />
              )}
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                if (canEdit)
                  updateNodeProperty(node.id, "visible", !node.visible);
              }}
              className={`p-0.5 rounded shrink-0 transition-colors
                ${node.visible === false
                  ? "text-gray-300 hover:text-gray-400"
                  : "text-gray-400 hover:text-gray-600"
                }
                ${!canEdit ? "cursor-default" : ""}
              `}
              title={node.visible === false ? "Show" : "Hide"}
            >
              {node.visible === false ? <EyeOff size={12} /> : <Eye size={12} />}
            </button>

            <div className="flex items-center gap-1.5 min-w-0 flex-1 ml-1">
              <span className="shrink-0 text-gray-400">{icon}</span>

              {editingId === node.id ? (
                <input
                  autoFocus
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={handleFinishRename}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleFinishRename();
                    if (e.key === "Escape") setEditingId(null);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="flex-1 min-w-0 px-1 py-0 text-[12px] border border-blue-400 rounded outline-none bg-white"
                />
              ) : (
                <span className="truncate text-[12px]">
                  {node.name ?? node.type}
                </span>
              )}
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                if (canEdit)
                  updateNodeProperty(node.id, "locked", !node.locked);
              }}
              className={`p-0.5 rounded shrink-0 transition-colors mr-1
                ${node.locked
                  ? "text-amber-500 hover:text-amber-600"
                  : "text-gray-300 hover:text-gray-400"
                }
                ${!canEdit ? "cursor-default" : ""}
              `}
              title={node.locked ? "Unlock" : "Lock"}
            >
              {node.locked ? <Lock size={11} /> : <LockOpen size={11} />}
            </button>

            {isDropTarget && dropTarget.position !== "inside" && (
              <div
                className={`absolute left-0 right-0 h-0.5 bg-blue-500 z-10 pointer-events-none
                  ${dropTarget.position === "before" ? "-top-0.5" : "-bottom-0.5"}
                `}
              />
            )}
          </div>

          {hasChildren && !isCollapsed && (
            <div>
              {children.map((child) => renderNode(child, depth + 1))}
            </div>
          )}
        </div>
      );
    },
    [
      childrenMap,
      collapsedIds,
      selectedIds,
      dropTarget,
      canEdit,
      isVisible,
      handleSelect,
      handleDragStart,
      handleDragOver,
      handleDragLeave,
      handleDrop,
      toggleCollapse,
      editingId,
      editValue,
      updateNodeProperty,
      handleFinishRename,
    ],
  );

  const topLevelNodes = childrenMap.get(null) ?? [];

  return (
    <div
      className="flex flex-col h-full bg-white border-r border-gray-100 shadow-[2px_0_12px_rgba(0,0,0,0.04)] mt-14"
      style={{ width: 260 }}
    >
      <div className="shrink-0 px-3 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2 mb-2.5">
          <Layers size={13} className="text-gray-400" />
          <span className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">
            Layers
          </span>
          <span className="text-[11px] text-gray-300 ml-auto">
            {nodes.length}
          </span>
        </div>
        <div className="relative">
          <Search
            size={12}
            className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search layers..."
            className="w-full pl-7 pr-2 py-1.5 text-[12px] border border-gray-200 rounded-lg outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 transition-colors placeholder:text-gray-300"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500"
            >
              &times;
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden py-1">
        {nodes.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
            <Layers size={20} className="text-gray-200" />
            <p className="text-[12px] text-gray-300">
              No layers yet
            </p>
            <p className="text-[11px] text-gray-200">
              Add a shape to get started
            </p>
          </div>
        ) : searchQuery && topLevelNodes.every((n) => !isVisible(n.id)) ? (
          <div className="px-4 py-8 text-center">
            <p className="text-[12px] text-gray-300">
              No layers match "{searchQuery}"
            </p>
          </div>
        ) : (
          topLevelNodes.map((node) => renderNode(node, 0))
        )}
      </div>
    </div>
  );
}
