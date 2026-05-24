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

type Role = "owner" | "editor" | "viewer";

const ROLE_STYLES: Record<Role, string> = {
  owner: "bg-amber-50  text-amber-700  border-amber-200",
  editor: "bg-blue-50   text-blue-700   border-blue-200",
  viewer: "bg-gray-100  text-gray-500   border-gray-200",
};

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
  saveIndicator: "Live" | "Reconnecting" | "Connecting...";
  role: Role;
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
  role,
  onSave,
  onBack,
}: TopToolbarProps) {
  const isLive = saveIndicator === "Live";

  const saveLabel =
    saveIndicator === "Live"
      ? "All changes saved"
      : saveIndicator === "Reconnecting"
        ? "Reconnecting..."
        : "Connecting...";

  return (
    <div className="absolute top-0 left-0 right-0 bg-white border-b border-gray-200 shadow-sm px-3 z-20 flex items-center justify-between h-14">
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
          title="Back"
        >
          <ArrowLeft size={16} />
        </button>

        <h1 className="text-sm font-semibold text-gray-900">Canvas editor</h1>

        <span
          className={`text-xs font-medium px-2 py-0.5 rounded-md border capitalize ${ROLE_STYLES[role]}`}
        >
          {role}
        </span>

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

      <div className="flex items-center gap-3">
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

        <div className="flex items-center gap-1">
          <button
            onClick={zoomOut}
            className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            title="Zoom out"
          >
            <ZoomOut size={15} />
          </button>
          <span className="min-w-14 text-center text-sm text-gray-600 font-mono">
            {Math.round(stageScale * 100)}%
          </span>
          <button
            onClick={zoomIn}
            className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            title="Zoom in"
          >
            <ZoomIn size={15} />
          </button>
          <button
            onClick={resetView}
            className="px-2.5 py-1.5 text-sm text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Reset
          </button>
        </div>

        <div className="w-px h-5 bg-gray-200" />

        <button
          onClick={onSave}
          disabled={!isLive}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
            isLive
              ? "bg-green-100 text-green-700 hover:bg-green-200"
              : "bg-gray-100 text-gray-600"
          }`}
          title={saveLabel}
        >
          {isLive ? (
            <Save size={15} />
          ) : (
            <Loader2 size={15} className="animate-spin" />
          )}
          <span className="text-sm font-medium">{saveLabel}</span>
        </button>
      </div>
    </div>
  );
}
