"use client";

import React, { useState, useMemo } from "react";
import { ShapeType } from "@/types/CanvasTypes";
import {
  Square,
  Circle,
  Triangle,
  Diamond,
  Star,
  Minus,
  ArrowRight,
  Type,
  Layout,
  StickyNote,
  Code2,
  Divide,
  Hexagon,
  Pentagon,
  Search,
  Plus,
  MousePointer,
} from "lucide-react";

interface InsertPanelProps {
  addShape: (type: ShapeType, file?: File) => void;
  canEdit: boolean;
}

interface CategoryItem {
  type: ShapeType;
  icon: React.ReactNode;
  label: string;
}

const CATEGORIES: { label: string; items: CategoryItem[] }[] = [
  {
    label: "Shapes",
    items: [
      { type: "rect", icon: <Square size={16} />, label: "Rectangle" },
      { type: "roundedRect", icon: <Square size={16} />, label: "Rounded Rect" },
      { type: "circle", icon: <Circle size={16} />, label: "Circle" },
      { type: "ellipse", icon: <Circle size={16} />, label: "Ellipse" },
      { type: "triangle", icon: <Triangle size={16} />, label: "Triangle" },
      { type: "diamond", icon: <Diamond size={16} />, label: "Diamond" },
      { type: "pentagon", icon: <Pentagon size={16} />, label: "Pentagon" },
      { type: "hexagon", icon: <Hexagon size={16} />, label: "Hexagon" },
      { type: "star", icon: <Star size={16} />, label: "Star" },
      { type: "line", icon: <Minus size={16} />, label: "Line" },
      { type: "arrow", icon: <ArrowRight size={16} />, label: "Arrow" },
      { type: "polyline", icon: <Minus size={16} />, label: "Polyline" },
    ],
  },
  {
    label: "Text & Notes",
    items: [
      { type: "text", icon: <Type size={16} />, label: "Text" },
      { type: "stickyNote", icon: <StickyNote size={16} />, label: "Sticky Note" },
      { type: "codeBlock", icon: <Code2 size={16} />, label: "Code Block" },
    ],
  },
  {
    label: "Containers",
    items: [
      { type: "frame", icon: <Layout size={16} />, label: "Frame" },
      { type: "divider", icon: <Divide size={16} />, label: "Divider" },
    ],
  },

];

export default function InsertPanel({ addShape, canEdit }: InsertPanelProps) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return CATEGORIES;
    const q = search.toLowerCase();
    return CATEGORIES.map((cat) => ({
      ...cat,
      items: cat.items.filter(
        (item) =>
          item.label.toLowerCase().includes(q) ||
          item.type.toLowerCase().includes(q),
      ),
    })).filter((cat) => cat.items.length > 0);
  }, [search]);

  const handleAdd = (type: ShapeType) => {
    if (!canEdit) return;
    addShape(type);
  };

  const handleDragStart = (e: React.DragEvent, type: ShapeType) => {
    if (!canEdit) return;
    e.dataTransfer.setData("text/plain", type);
    e.dataTransfer.effectAllowed = "copy";
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="shrink-0 px-3 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2 mb-2.5">
          <Plus size={13} className="text-gray-400" />
          <span className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">
            Insert
          </span>
        </div>
        <div className="relative">
          <Search
            size={12}
            className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search elements..."
            className="w-full pl-7 pr-2 py-1.5 text-[12px] border border-gray-200 rounded-lg outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 transition-colors placeholder:text-gray-300"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500"
            >
              &times;
            </button>
          )}
        </div>
      </div>

      {/* Categories */}
      <div className="flex-1 overflow-y-auto py-2 px-2">
        {!canEdit && (
          <div className="flex items-center gap-1.5 px-3 py-2 mb-2 text-[11px] text-gray-400 bg-gray-50 rounded-lg">
            <MousePointer size={12} />
            View-only mode
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="px-3 py-8 text-center">
            <p className="text-[12px] text-gray-300">
              No results for &ldquo;{search}&rdquo;
            </p>
          </div>
        ) : (
          filtered.map((cat) => (
            <div key={cat.label} className="mb-2">
              <span className="block px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                {cat.label}
              </span>
              <div className="grid grid-cols-2 gap-1">
                {cat.items.map((item) => (
                  <button
                    key={item.type}
                    onClick={() => handleAdd(item.type)}
                    onDragStart={(e) => handleDragStart(e, item.type)}
                    draggable={canEdit}
                    disabled={!canEdit}
                    className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-[12px] text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors disabled:opacity-40 disabled:cursor-not-allowed border border-transparent hover:border-gray-200"
                    title={`Add ${item.label}`}
                  >
                    <span className="shrink-0 text-gray-400">{item.icon}</span>
                    <span className="truncate">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
