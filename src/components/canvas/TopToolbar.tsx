// /app/components/TopToolbar.tsx
"use client";

import React from "react";
import {
  Move,
  MousePointer,
  Square,
  Circle as CircleIcon,
  Type,
  ZoomIn,
  ZoomOut,
  RotateCcw,
} from "lucide-react";

interface TopToolbarProps {
  tool: "select" | "pan";
  setTool: (tool: "select" | "pan") => void;
  addShape: (type: "rect" | "circle" | "text") => void;
  undo: () => void;
  redo: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetView: () => void;
  stageScale: number;
  canUndo: boolean;
  canRedo: boolean;
}

export default function TopToolbar({
  tool,
  setTool,
  addShape,
  undo,
  redo,
  zoomIn,
  zoomOut,
  resetView,
  stageScale,
  canUndo,
  canRedo,
}: TopToolbarProps) {
  return (
    <div className="absolute top-0 left-0 right-0 bg-white border-b border-gray-200 shadow-sm p-3 z-20 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-bold text-gray-900 mr-6">Canvas Editor</h1>

        {/* Tool Selection */}
        <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-lg">
          <button
            onClick={() => setTool("select")}
            className={`flex items-center gap-2 px-3 py-2 rounded-md transition-all ${
              tool === "select"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            <MousePointer size={16} />
            <span className="text-sm font-medium">Select</span>
          </button>
          <button
            onClick={() => setTool("pan")}
            className={`flex items-center gap-2 px-3 py-2 rounded-md transition-all ${
              tool === "pan"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            <Move size={16} />
            <span className="text-sm font-medium">Pan</span>
          </button>
        </div>

        {/* Shape Tools */}
        <div className="flex items-center gap-2 ml-4">
          <button
            onClick={() => addShape("rect")}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            title="Add Rectangle"
          >
            <Square size={16} />
            <span className="text-sm">Rectangle</span>
          </button>
          <button
            onClick={() => addShape("circle")}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            title="Add Circle"
          >
            <CircleIcon size={16} />
            <span className="text-sm">Circle</span>
          </button>
          <button
            onClick={() => addShape("text")}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            title="Add Text"
          >
            <Type size={16} />
            <span className="text-sm">Text</span>
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Undo/Redo */}
        <div className="flex items-center gap-1">
          <button
            onClick={undo}
            disabled={!canUndo}
            className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Undo (Ctrl+Z)"
          >
            <RotateCcw size={16} />
          </button>
          <button
            onClick={redo}
            disabled={!canRedo}
            className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Redo (Ctrl+Shift+Z)"
          >
            <RotateCcw size={16} className="scale-x-[-1]" />
          </button>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-2 text-sm">
          <button
            onClick={zoomOut}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            title="Zoom Out"
          >
            <ZoomOut size={16} />
          </button>
          <span className="min-w-[4rem] text-center text-gray-600 font-mono">
            {Math.round(stageScale * 100)}%
          </span>
          <button
            onClick={zoomIn}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            title="Zoom In"
          >
            <ZoomIn size={16} />
          </button>
          <button
            onClick={resetView}
            className="px-3 py-2 text-sm rounded-lg hover:bg-gray-100 transition-colors"
            title="Reset View"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}
