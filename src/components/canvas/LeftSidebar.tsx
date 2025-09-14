// /app/components/LeftSidebar.tsx
"use client";

import React from "react";

interface LeftSidebarProps {
  addShape: (type: "rect" | "circle" | "text") => void;
  showGrid: boolean;
  setShowGrid: (show: boolean) => void;
  error: string | null;
}

export default function LeftSidebar({
  addShape,
  showGrid,
  setShowGrid,
  error,
}: LeftSidebarProps) {
  return (
    <div className="w-64 bg-white border-r border-gray-200 shadow-sm p-4 flex flex-col gap-4 mt-14 z-10">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Shapes</h2>
        <div className="grid grid-cols-1 gap-2">
          <button
            onClick={() => addShape("rect")}
            className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-blue-200 transition-all group"
          >
            <div className="w-8 h-6 border-2 border-blue-500 rounded group-hover:border-blue-600"></div>
            <span className="text-sm font-medium text-gray-700">Rectangle</span>
          </button>
          <button
            onClick={() => addShape("circle")}
            className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-blue-200 transition-all group"
          >
            <div className="w-7 h-7 border-2 border-blue-500 rounded-full group-hover:border-blue-600"></div>
            <span className="text-sm font-medium text-gray-700">Circle</span>
          </button>
          <button
            onClick={() => addShape("text")}
            className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-blue-200 transition-all group"
          >
            <div className="w-7 h-7 flex items-center justify-center text-blue-500 font-bold group-hover:text-blue-600">
              T
            </div>
            <span className="text-sm font-medium text-gray-700">Text</span>
          </button>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Canvas</h2>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={showGrid}
              onChange={(e) => setShowGrid(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Show Grid</span>
          </label>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">AI Prompt</h2>
        <div className="relative">
          <textarea
            placeholder="✨ Describe your design idea..."
            rows={10}
            className="w-full resize-none rounded-2xl border border-gray-200 bg-white shadow-sm px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-300 focus:outline-none transition-all"
          />
          <button className="absolute bottom-3 right-3 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 via-indigo-600 to-purple-600 text-white text-sm font-semibold shadow-lg hover:shadow-indigo-500/40 hover:scale-105 active:scale-95 transition-all">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            Generate
          </button>
        </div>
      </div>
    </div>
  );
}
