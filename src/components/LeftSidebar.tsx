"use client";

import React, { useState } from "react";
import {
  Frame as FrameIcon,
  Grid3X3,
  AlertCircle,
  RefreshCw,
  ChevronLeft,
  Settings2,
} from "lucide-react";

interface LeftSidebarProps {
  showGrid: boolean;
  setShowGrid: (show: boolean) => void;
  error: string | null;
}

export default function LeftSidebar({
  showGrid,
  setShowGrid,
  error,
}: LeftSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div
      className="relative flex flex-col mt-14 z-10 transition-all duration-300 ease-in-out"
      style={{ width: collapsed ? "48px" : "224px" }}
    >
      {/* Sidebar panel */}
      <div className="h-full bg-white border-r border-gray-100 shadow-[2px_0_12px_rgba(0,0,0,0.04)] flex flex-col overflow-hidden transition-all duration-300 ease-in-out">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-3 border-b border-gray-100 shrink-0">
          {!collapsed && (
            <div className="flex items-center gap-2 overflow-hidden">
              <Settings2 size={13} className="text-gray-400 shrink-0" />
              <span className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 whitespace-nowrap">
                Tools
              </span>
            </div>
          )}
          <button
            onClick={() => setCollapsed((c) => !c)}
            className={`p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all duration-300 ${collapsed ? "mx-auto" : "ml-auto"}`}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <ChevronLeft
              size={15}
              className="transition-transform duration-300"
              style={{
                transform: collapsed ? "rotate(180deg)" : "rotate(0deg)",
              }}
            />
          </button>
        </div>

        {/* Content — hidden when collapsed */}
        <div
          className="flex flex-col gap-1 p-3 overflow-hidden transition-all duration-300"
          style={{
            opacity: collapsed ? 0 : 1,
            pointerEvents: collapsed ? "none" : "auto",
          }}
        >
          {/* Grid toggle */}
          <label className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-gray-50 cursor-pointer group transition-colors">
            <div className="flex items-center gap-2 min-w-0">
              <Grid3X3
                size={13}
                className="text-gray-400 group-hover:text-gray-600 shrink-0 transition-colors"
              />
              <span className="text-[13px] text-gray-600 font-medium whitespace-nowrap">
                Show Grid
              </span>
            </div>
            <div className="relative shrink-0">
              <input
                type="checkbox"
                checked={showGrid}
                onChange={(e) => setShowGrid(e.target.checked)}
                className="sr-only peer"
              />
              {/* Custom toggle track */}
              <div className="w-8 h-4 rounded-full bg-gray-200 peer-checked:bg-blue-500 transition-colors duration-200" />
              {/* Toggle thumb */}
              <div className="absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white shadow-sm transition-transform duration-200 peer-checked:translate-x-4" />
            </div>
          </label>
        </div>

        {/* Error — hidden when collapsed */}
        {error && !collapsed && (
          <div className="mx-3 mb-3 p-2.5 bg-red-50 border border-red-100 rounded-lg flex items-start gap-2 transition-all duration-300">
            <AlertCircle size={13} className="text-red-400 mt-0.5 shrink-0" />
            <p className="text-[12px] text-red-500 leading-relaxed">{error}</p>
          </div>
        )}

        {/* Collapsed error dot indicator */}
        {error && collapsed && (
          <div className="flex justify-center mt-2">
            <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
          </div>
        )}
      </div>
    </div>
  );
}
