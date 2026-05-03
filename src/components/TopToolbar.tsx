"use client";

import React from "react";
import {
  Move,
  MousePointer,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Save,
  ArrowLeft,
  Loader2,
} from "lucide-react";

interface TopToolbarProps {
  tool: "select" | "pan";
  setTool: (tool: "select" | "pan") => void;
  undo: () => void;
  redo: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetView: () => void;
  stageScale: number;
  canUndo: boolean;
  canRedo: boolean;
  saveIndicator: "Saving..." | "Unsaved" | "Saved";
  onSave: () => void;
  onBack: () => void;
}

export default function TopToolbar({
  tool,
  setTool,
  undo,
  redo,
  zoomIn,
  zoomOut,
  resetView,
  stageScale,
  canUndo,
  canRedo,
  saveIndicator,
  onSave,
  onBack,
}: TopToolbarProps) {
  return (
    <div className="absolute top-0 left-0 right-0 bg-white border-b border-gray-200 shadow-sm px-3 z-20 flex items-center justify-between h-[60px]">
      {/* Left — back + title + tools */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
          title="Back"
        >
          <ArrowLeft size={16} />
        </button>

        <h1 className="text-sm font-semibold text-gray-900">Canvas Editor</h1>

        <div className="w-px h-5 bg-gray-200 mx-1" />

        <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-lg">
          <button
            onClick={() => setTool("select")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-all ${
              tool === "select"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            <MousePointer size={15} />
            <span className="text-sm font-medium">Select</span>
          </button>
          <button
            onClick={() => setTool("pan")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-all ${
              tool === "pan"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            <Move size={15} />
            <span className="text-sm font-medium">Pan</span>
          </button>
        </div>
      </div>

      {/* Right — undo/redo + zoom + save */}
      <div className="flex items-center gap-3">
        {/* Undo / Redo */}
        <div className="flex items-center gap-1">
          <button
            onClick={undo}
            disabled={!canUndo}
            className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            title="Undo (Ctrl+Z)"
          >
            <RotateCcw size={15} />
          </button>
          <button
            onClick={redo}
            disabled={!canRedo}
            className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            title="Redo (Ctrl+Shift+Z)"
          >
            <RotateCcw size={15} className="scale-x-[-1]" />
          </button>
        </div>

        <div className="w-px h-5 bg-gray-200" />

        {/* Zoom */}
        <div className="flex items-center gap-1">
          <button
            onClick={zoomOut}
            className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            title="Zoom Out"
          >
            <ZoomOut size={15} />
          </button>
          <span className="min-w-[3.5rem] text-center text-sm text-gray-600 font-mono">
            {Math.round(stageScale * 100)}%
          </span>
          <button
            onClick={zoomIn}
            className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            title="Zoom In"
          >
            <ZoomIn size={15} />
          </button>
          <button
            onClick={resetView}
            className="px-2.5 py-1.5 text-sm text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
            title="Reset View"
          >
            Reset
          </button>
        </div>

        <div className="w-px h-5 bg-gray-200" />

        {/* Save status + button */}
        <div className="flex items-center gap-2">
          <span
            className={`text-xs font-medium ${
              saveIndicator === "Saved"
                ? "text-green-600"
                : saveIndicator === "Saving..."
                  ? "text-gray-400"
                  : "text-orange-500"
            }`}
          >
            {saveIndicator}
          </span>
          <button
            onClick={onSave}
            disabled={
              saveIndicator === "Saving..." || saveIndicator === "Saved"
            }
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Save (Ctrl+S)"
          >
            {saveIndicator === "Saving..." ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Save size={14} />
            )}
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
