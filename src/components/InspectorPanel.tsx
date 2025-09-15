"use client";

import React from "react";
import { MousePointer, Copy, Trash2 } from "lucide-react";
import { Node } from "@/types/CanvasTypes";
import {
  FRAME_DEFAULT_STROKE_STYLE,
  MIN_SIZE,
} from "@/constants/CanvasConstants";

interface InspectorPanelProps {
  selectedNode: Node | null;
  updateNodeProperty: (id: string, property: keyof Node, value: any) => void;
  duplicateShape: () => void;
  deleteShape: () => void;
}

export default function InspectorPanel({
  selectedNode,
  updateNodeProperty,
  duplicateShape,
  deleteShape,
}: InspectorPanelProps) {
  if (!selectedNode) {
    return (
      <div className="w-72 bg-white border-l border-gray-200 shadow-sm p-4 mt-14 overflow-y-auto">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Properties</h2>
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
            <MousePointer size={24} className="text-gray-400" />
          </div>
          <p className="text-gray-500 text-sm mb-2">No shape selected</p>
          <p className="text-gray-400 text-xs">
            Click on a shape to edit its properties
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-72 bg-white border-l border-gray-200 shadow-sm p-4 mt-14 overflow-y-auto">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Properties</h2>
      <div className="space-y-4">
        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700 capitalize">
              {selectedNode.type}
            </span>
            <div className="flex gap-1">
              <button
                onClick={duplicateShape}
                className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded transition-colors"
                title="Duplicate (Ctrl+C)"
              >
                <Copy size={14} />
              </button>
              <button
                onClick={deleteShape}
                className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-100 rounded transition-colors"
                title="Delete (Del)"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Position */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Position
          </label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-gray-500 mb-1">X</label>
              <input
                type="number"
                value={Math.round(selectedNode.x)}
                onChange={(e) =>
                  updateNodeProperty(
                    selectedNode.id,
                    "x",
                    parseFloat(e.target.value) || 0
                  )
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Y</label>
              <input
                type="number"
                value={Math.round(selectedNode.y)}
                onChange={(e) =>
                  updateNodeProperty(
                    selectedNode.id,
                    "y",
                    parseFloat(e.target.value) || 0
                  )
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Size */}
        {selectedNode.type !== "circle" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Size
            </label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Width
                </label>
                <input
                  type="number"
                  min={MIN_SIZE}
                  value={Math.round(selectedNode.width)}
                  onChange={(e) =>
                    updateNodeProperty(
                      selectedNode.id,
                      "width",
                      Math.max(MIN_SIZE, parseFloat(e.target.value) || MIN_SIZE)
                    )
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Height
                </label>
                <input
                  type="number"
                  min={MIN_SIZE}
                  value={Math.round(selectedNode.height)}
                  onChange={(e) =>
                    updateNodeProperty(
                      selectedNode.id,
                      "height",
                      Math.max(MIN_SIZE, parseFloat(e.target.value) || MIN_SIZE)
                    )
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        )}

        {/* Radius for circle */}
        {selectedNode.type === "circle" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Radius
            </label>
            <input
              type="number"
              min={MIN_SIZE / 2}
              value={Math.round(selectedNode.radius)}
              onChange={(e) =>
                updateNodeProperty(
                  selectedNode.id,
                  "radius",
                  Math.max(
                    MIN_SIZE / 2,
                    parseFloat(e.target.value) || MIN_SIZE / 2
                  )
                )
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        )}

        {/* Fill Color */}
        {selectedNode.type === "frame" && (
          <div>
            <label className="block text-xs text-gray-500 mb-1">
              Stroke Style
            </label>
            <select
              value={selectedNode.strokeStyle || "solid"}
              onChange={(e) =>
                updateNodeProperty(
                  selectedNode.id,
                  "strokeStyle",
                  e.target.value as "solid" | "dashed"
                )
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="solid">Solid</option>
              <option value="dashed">Dashed</option>
            </select>
          </div>
        )}

        {/* Stroke */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Stroke
          </label>
          <div className="space-y-2">
            <div className="flex gap-2">
              <input
                type="color"
                value={selectedNode.stroke}
                onChange={(e) =>
                  updateNodeProperty(selectedNode.id, "stroke", e.target.value)
                }
                className="w-16 h-10 border border-gray-300 rounded-lg cursor-pointer"
              />
              <input
                type="text"
                value={selectedNode.stroke}
                onChange={(e) =>
                  updateNodeProperty(selectedNode.id, "stroke", e.target.value)
                }
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                placeholder="#000000"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Width</label>
              <input
                type="number"
                min="0"
                max="20"
                value={selectedNode.strokeWidth}
                onChange={(e) =>
                  updateNodeProperty(
                    selectedNode.id,
                    "strokeWidth",
                    Math.max(0, parseFloat(e.target.value) || 0)
                  )
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            {selectedNode.type === "frame" && (
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Stroke Style
                </label>
                <select
                  value={selectedNode.strokeStyle || "solid"}
                  onChange={(e) =>
                    updateNodeProperty(
                      selectedNode.id,
                      "strokeStyle",
                      e.target.value as "solid" | "dashed"
                    )
                  }
                  className="w-full px-3 py-2 border border-black rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="solid">Solid</option>
                  <option value="dashed">Dashed</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Opacity */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Opacity
          </label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={selectedNode.opacity}
              onChange={(e) =>
                updateNodeProperty(
                  selectedNode.id,
                  "opacity",
                  parseFloat(e.target.value)
                )
              }
              className="flex-1"
            />
            <span className="text-sm text-gray-600 w-10 text-right">
              {Math.round(selectedNode.opacity * 100)}%
            </span>
          </div>
        </div>

        {/* Rotation */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Rotation
          </label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="0"
              max="360"
              value={Math.round(selectedNode.rotation)}
              onChange={(e) =>
                updateNodeProperty(
                  selectedNode.id,
                  "rotation",
                  parseFloat(e.target.value)
                )
              }
              className="flex-1"
            />
            <span className="text-sm text-gray-600 w-10 text-right">
              {Math.round(selectedNode.rotation)}°
            </span>
          </div>
        </div>

        {/* Text Properties */}
        {selectedNode.type === "text" && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Text Content
              </label>
              <textarea
                value={selectedNode.text}
                onChange={(e) =>
                  updateNodeProperty(selectedNode.id, "text", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={3}
                placeholder="Enter text..."
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Font Size
                </label>
                <input
                  type="number"
                  min="8"
                  max="200"
                  value={selectedNode.fontSize}
                  onChange={(e) =>
                    updateNodeProperty(
                      selectedNode.id,
                      "fontSize",
                      Math.max(8, parseFloat(e.target.value) || 8)
                    )
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Font Family
                </label>
                <select
                  value={selectedNode.fontFamily}
                  onChange={(e) =>
                    updateNodeProperty(
                      selectedNode.id,
                      "fontFamily",
                      e.target.value
                    )
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="Inter, system-ui, sans-serif">Inter</option>
                  <option value="Arial, sans-serif">Arial</option>
                  <option value="Helvetica, sans-serif">Helvetica</option>
                  <option value="Georgia, serif">Georgia</option>
                  <option value="Times New Roman, serif">Times</option>
                  <option value="Courier New, monospace">Courier</option>
                </select>
              </div>
            </div>
          </>
        )}

        {/* Action Buttons */}
        <div className="pt-4 border-t border-gray-200 space-y-2">
          <button
            onClick={duplicateShape}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
          >
            <Copy size={16} />
            Duplicate Shape
          </button>
          <button
            onClick={deleteShape}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
          >
            <Trash2 size={16} />
            Delete Shape
          </button>
        </div>
      </div>
    </div>
  );
}
