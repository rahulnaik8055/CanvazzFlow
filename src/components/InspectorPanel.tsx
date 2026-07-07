"use client";

import React, { useState, useCallback } from "react";
import {
  MousePointer,
  Copy,
  Trash2,
  Eye,
  Lock,
  Unlock,
  ChevronDown,
  ChevronRight,
  BringToFront,
  SendToBack,
  ArrowUpToLine,
  ArrowDownToLine,
  Type,
} from "lucide-react";
import { Node } from "@/types/CanvasTypes";
import { MIN_SIZE } from "@/constants/CanvasConstants";
import ColorPicker from "./ColorPicker";

interface InspectorPanelProps {
  selectedNode: Node | null;
  updateNodeProperty: (id: string, property: keyof Node, value: any) => void;
  duplicateShape: () => void;
  deleteShape: () => void;
  bringForward?: () => void;
  sendBackward?: () => void;
  bringToFront?: () => void;
  sendToBack?: () => void;
  toggleLock?: () => void;
  toggleVisibility?: () => void;
  canEdit: boolean;
}

const inputCls =
  "w-full px-2 py-1.5 text-[12px] font-mono border border-gray-200 rounded-lg outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 transition-colors disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed";

const selectCls =
  "w-full px-2 py-1.5 text-[12px] border border-gray-200 rounded-lg outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 transition-colors bg-white disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed";

function Section({
  label,
  defaultOpen = true,
  children,
}: {
  label: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-gray-100 last:border-b-0">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 w-full px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400 hover:text-gray-600 transition-colors"
      >
        {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        {label}
      </button>
      {open && <div className="px-3 pb-3 space-y-2.5">{children}</div>}
    </div>
  );
}

export default function InspectorPanel({
  selectedNode,
  updateNodeProperty,
  duplicateShape,
  deleteShape,
  bringForward,
  sendBackward,
  bringToFront,
  sendToBack,
  toggleLock,
  toggleVisibility,
  canEdit,
}: InspectorPanelProps) {
  const isText = selectedNode?.type === "text" || selectedNode?.type === "stickyNote" || selectedNode?.type === "codeBlock";

  if (!selectedNode) {
    return (
      <div className="w-72 bg-white border-l border-gray-200 shadow-sm mt-14 overflow-y-auto flex flex-col">
        <div className="flex flex-col items-center justify-center flex-1 px-6 py-16 text-center">
          <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center mb-4 ring-1 ring-gray-100">
            <MousePointer size={20} className="text-gray-300" />
          </div>
          <p className="text-sm font-medium text-gray-400 mb-1">No selection</p>
          <p className="text-xs text-gray-300 leading-relaxed">
            Select an element to view and edit its properties
          </p>
        </div>
      </div>
    );
  }

  const disabled = !canEdit;

  return (
    <div className="w-72 bg-white border-l border-gray-200 shadow-sm mt-14 overflow-y-auto">
      {/* Name header */}
      <div className="px-3 pt-3 pb-2 border-b border-gray-100">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
            {selectedNode.type}
          </span>
          <span className="text-[10px] text-gray-300">/</span>
          <span className="text-[10px] text-gray-400 font-mono">
            #{selectedNode.id.slice(-6)}
          </span>
        </div>
        {canEdit ? (
          <input
            type="text"
            value={selectedNode.name || ""}
            onChange={(e) =>
              updateNodeProperty(selectedNode.id, "name", e.target.value)
            }
            className="w-full text-sm font-medium text-gray-900 outline-none bg-transparent placeholder:text-gray-300"
            placeholder="Layer name"
          />
        ) : (
          <p className="text-sm font-medium text-gray-900">
            {selectedNode.name || selectedNode.type}
          </p>
        )}
        {canEdit && (
          <div className="flex items-center gap-1 mt-2 pt-2 border-t border-gray-50">
            <button
              onClick={duplicateShape}
              className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors text-[11px] font-medium"
            >
              <Copy size={13} />
              Duplicate
            </button>
            <button
              onClick={deleteShape}
              className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg border border-red-200 text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors text-[11px] font-medium"
            >
              <Trash2 size={13} />
              Delete
            </button>
          </div>
        )}
      </div>

      {/* Section: Position */}
      <Section label="Position">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[10px] text-gray-400 mb-0.5 font-medium">X</label>
            <input
              type="number"
              value={Math.round(selectedNode.x)}
              disabled={disabled}
              onChange={(e) =>
                updateNodeProperty(selectedNode.id, "x", parseFloat(e.target.value) || 0)
              }
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-[10px] text-gray-400 mb-0.5 font-medium">Y</label>
            <input
              type="number"
              value={Math.round(selectedNode.y)}
              disabled={disabled}
              onChange={(e) =>
                updateNodeProperty(selectedNode.id, "y", parseFloat(e.target.value) || 0)
              }
              className={inputCls}
            />
          </div>
        </div>
      </Section>

      {/* Section: Size */}
      <Section label="Size">
        {selectedNode.type === "circle" ? (
          <div>
            <label className="block text-[10px] text-gray-400 mb-0.5 font-medium">Radius</label>
            <input
              type="number"
              min={MIN_SIZE / 2}
              value={Math.round(selectedNode.radius || 50)}
              disabled={disabled}
              onChange={(e) =>
                updateNodeProperty(
                  selectedNode.id,
                  "radius",
                  Math.max(MIN_SIZE / 2, parseFloat(e.target.value) || MIN_SIZE / 2),
                )
              }
              className={inputCls}
            />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] text-gray-400 mb-0.5 font-medium">W</label>
              <input
                type="number"
                min={MIN_SIZE}
                value={Math.round(selectedNode.width)}
                disabled={disabled}
                onChange={(e) =>
                  updateNodeProperty(
                    selectedNode.id,
                    "width",
                    Math.max(MIN_SIZE, parseFloat(e.target.value) || MIN_SIZE),
                  )
                }
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-[10px] text-gray-400 mb-0.5 font-medium">H</label>
              <input
                type="number"
                min={MIN_SIZE}
                value={Math.round(selectedNode.height)}
                disabled={disabled}
                onChange={(e) =>
                  updateNodeProperty(
                    selectedNode.id,
                    "height",
                    Math.max(MIN_SIZE, parseFloat(e.target.value) || MIN_SIZE),
                  )
                }
                className={inputCls}
              />
            </div>
          </div>
        )}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[10px] text-gray-400 mb-0.5 font-medium">Rotation</label>
            <input
              type="number"
              min={0}
              max={360}
              value={Math.round(selectedNode.rotation)}
              disabled={disabled}
              onChange={(e) =>
                updateNodeProperty(selectedNode.id, "rotation", parseFloat(e.target.value) || 0)
              }
              className={inputCls}
            />
          </div>
          {(selectedNode.type === "roundedRect" || selectedNode.type === "rect" || selectedNode.type === "image" || selectedNode.type === "stickyNote" || selectedNode.type === "codeBlock") && (
            <div>
              <label className="block text-[10px] text-gray-400 mb-0.5 font-medium">Radius</label>
              <input
                type="number"
                min={0}
                value={Math.round(selectedNode.cornerRadius || 0)}
                disabled={disabled}
                onChange={(e) =>
                  updateNodeProperty(
                    selectedNode.id,
                    "cornerRadius",
                    Math.max(0, parseFloat(e.target.value) || 0),
                  )
                }
                className={inputCls}
              />
            </div>
          )}
        </div>
      </Section>

      {/* Section: Appearance */}
      <Section label="Appearance">
        <ColorPicker
          label="Fill"
          value={selectedNode.fill}
          onChange={(color) => updateNodeProperty(selectedNode.id, "fill", color)}
        />
        <ColorPicker
          label="Stroke"
          value={selectedNode.stroke}
          onChange={(color) => updateNodeProperty(selectedNode.id, "stroke", color)}
        />
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[10px] text-gray-400 mb-0.5 font-medium">Width</label>
            <input
              type="number"
              min={0}
              max={20}
              step={0.5}
              value={selectedNode.strokeWidth}
              disabled={disabled}
              onChange={(e) =>
                updateNodeProperty(selectedNode.id, "strokeWidth", Math.max(0, parseFloat(e.target.value) || 0))
              }
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-[10px] text-gray-400 mb-0.5 font-medium">Style</label>
            <select
              value={selectedNode.strokeStyle || "solid"}
              disabled={disabled}
              onChange={(e) =>
                updateNodeProperty(selectedNode.id, "strokeStyle", e.target.value)
              }
              className={selectCls}
            >
              <option value="solid">Solid</option>
              <option value="dashed">Dashed</option>
              <option value="dotted">Dotted</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-[10px] text-gray-400 mb-0.5 font-medium">Opacity</label>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={selectedNode.opacity}
              disabled={disabled}
              onChange={(e) =>
                updateNodeProperty(selectedNode.id, "opacity", parseFloat(e.target.value))
              }
              className="flex-1 h-1.5 accent-blue-500"
            />
            <span className="text-[11px] text-gray-400 font-mono w-8 text-right">
              {Math.round(selectedNode.opacity * 100)}%
            </span>
          </div>
        </div>
      </Section>

      {/* Section: Typography (text-based nodes) */}
      {isText && (
        <Section label="Typography">
          <div>
            <label className="block text-[10px] text-gray-400 mb-0.5 font-medium">Content</label>
            <textarea
              value={selectedNode.text || ""}
              disabled={disabled}
              onChange={(e) =>
                updateNodeProperty(selectedNode.id, "text", e.target.value)
              }
              rows={3}
              className={`${inputCls} resize-none font-sans`}
              placeholder="Type here..."
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] text-gray-400 mb-0.5 font-medium">Font</label>
              <select
                value={selectedNode.fontFamily || "Inter, system-ui, sans-serif"}
                disabled={disabled}
                onChange={(e) =>
                  updateNodeProperty(selectedNode.id, "fontFamily", e.target.value)
                }
                className={selectCls}
              >
                <option value="Inter, system-ui, sans-serif">Inter</option>
                <option value="Arial, sans-serif">Arial</option>
                <option value="Helvetica, sans-serif">Helvetica</option>
                <option value="Georgia, serif">Georgia</option>
                <option value="Times New Roman, serif">Times</option>
                <option value="Courier New, monospace">Courier</option>
                <option value="JetBrains Mono, monospace">JetBrains Mono</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] text-gray-400 mb-0.5 font-medium">Size</label>
              <input
                type="number"
                min={8}
                max={300}
                value={selectedNode.fontSize || 16}
                disabled={disabled}
                onChange={(e) =>
                  updateNodeProperty(selectedNode.id, "fontSize", Math.max(8, parseFloat(e.target.value) || 8))
                }
                className={inputCls}
              />
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() =>
                updateNodeProperty(
                  selectedNode.id,
                  "fontWeight",
                  selectedNode.fontWeight === "bold" ? "normal" : "bold",
                )
              }
              disabled={disabled}
              className={`px-2.5 py-1.5 text-[11px] rounded-md border transition-colors ${
                selectedNode.fontWeight === "bold"
                  ? "bg-blue-50 border-blue-200 text-blue-700"
                  : "border-gray-200 text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              } disabled:opacity-40 disabled:cursor-not-allowed`}
              title="Bold"
            >
              <strong>B</strong>
            </button>
            <button
              onClick={() =>
                updateNodeProperty(
                  selectedNode.id,
                  "fontStyle",
                  selectedNode.fontStyle === "italic" ? "normal" : "italic",
                )
              }
              disabled={disabled}
              className={`px-2.5 py-1.5 text-[11px] rounded-md border transition-colors ${
                selectedNode.fontStyle === "italic"
                  ? "bg-blue-50 border-blue-200 text-blue-700"
                  : "border-gray-200 text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              } disabled:opacity-40 disabled:cursor-not-allowed`}
              title="Italic"
            >
              <em>I</em>
            </button>
            <button
              onClick={() =>
                updateNodeProperty(
                  selectedNode.id,
                  "textDecoration",
                  selectedNode.textDecoration === "underline" ? "none" : "underline",
                )
              }
              disabled={disabled}
              className={`px-2.5 py-1.5 text-[11px] rounded-md border transition-colors ${
                selectedNode.textDecoration === "underline"
                  ? "bg-blue-50 border-blue-200 text-blue-700"
                  : "border-gray-200 text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              } disabled:opacity-40 disabled:cursor-not-allowed`}
              title="Underline"
            >
              <u>U</u>
            </button>
            <div className="flex-1" />
            <select
              value={selectedNode.textAlign || "left"}
              disabled={disabled}
              onChange={(e) =>
                updateNodeProperty(selectedNode.id, "textAlign", e.target.value)
              }
              className="px-1.5 py-1.5 text-[11px] border border-gray-200 rounded-md outline-none bg-white disabled:opacity-40"
            >
              <option value="left">L</option>
              <option value="center">C</option>
              <option value="right">R</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] text-gray-400 mb-0.5 font-medium">Letter Spacing</label>
              <input
                type="number"
                min={-5}
                max={20}
                step={0.5}
                value={selectedNode.letterSpacing || 0}
                disabled={disabled}
                onChange={(e) =>
                  updateNodeProperty(selectedNode.id, "letterSpacing", parseFloat(e.target.value) || 0)
                }
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-[10px] text-gray-400 mb-0.5 font-medium">Line Height</label>
              <input
                type="number"
                min={0.5}
                max={5}
                step={0.1}
                value={selectedNode.lineHeight || 1.2}
                disabled={disabled}
                onChange={(e) =>
                  updateNodeProperty(selectedNode.id, "lineHeight", Math.max(0.5, parseFloat(e.target.value) || 1.2))
                }
                className={inputCls}
              />
            </div>
          </div>
        </Section>
      )}

      {/* Section: Effects */}
      <Section label="Effects" defaultOpen={false}>
        <ColorPicker
          label="Shadow Color"
          value={selectedNode.shadowColor || "transparent"}
          onChange={(color) =>
            updateNodeProperty(selectedNode.id, "shadowColor", color)
          }
        />
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[10px] text-gray-400 mb-0.5 font-medium">Blur</label>
            <input
              type="number"
              min={0}
              max={50}
              step={0.5}
              value={selectedNode.shadowBlur || 0}
              disabled={disabled}
              onChange={(e) =>
                updateNodeProperty(selectedNode.id, "shadowBlur", Math.max(0, parseFloat(e.target.value) || 0))
              }
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-[10px] text-gray-400 mb-0.5 font-medium">Opacity</label>
            <input
              type="number"
              min={0}
              max={1}
              step={0.05}
              value={selectedNode.shadowOpacity || 0}
              disabled={disabled}
              onChange={(e) =>
                updateNodeProperty(selectedNode.id, "shadowOpacity", Math.max(0, Math.min(1, parseFloat(e.target.value) || 0)))
              }
              className={inputCls}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[10px] text-gray-400 mb-0.5 font-medium">Offset X</label>
            <input
              type="number"
              value={selectedNode.shadowOffsetX || 0}
              disabled={disabled}
              onChange={(e) =>
                updateNodeProperty(selectedNode.id, "shadowOffsetX", parseFloat(e.target.value) || 0)
              }
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-[10px] text-gray-400 mb-0.5 font-medium">Offset Y</label>
            <input
              type="number"
              value={selectedNode.shadowOffsetY || 0}
              disabled={disabled}
              onChange={(e) =>
                updateNodeProperty(selectedNode.id, "shadowOffsetY", parseFloat(e.target.value) || 0)
              }
              className={inputCls}
            />
          </div>
        </div>
        <div>
          <label className="block text-[10px] text-gray-400 mb-0.5 font-medium">Blur Filter</label>
          <input
            type="range"
            min={0}
            max={10}
            step={0.5}
            value={selectedNode.blurRadius || 0}
            disabled={disabled}
            onChange={(e) =>
              updateNodeProperty(selectedNode.id, "blurRadius", parseFloat(e.target.value))
            }
            className="flex-1 h-1.5 accent-blue-500 w-full"
          />
        </div>
      </Section>

      {/* Section: Arrange */}
      <Section label="Arrange" defaultOpen={false}>
        {canEdit && (
          <>
            <div className="flex items-center gap-1">
              <button
                onClick={bringToFront}
                className="flex-1 flex flex-col items-center gap-1 px-2 py-2 rounded-lg border border-gray-200 text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors text-[10px]"
                title="Bring to Front"
              >
                <BringToFront size={14} />
                Front
              </button>
              <button
                onClick={sendToBack}
                className="flex-1 flex flex-col items-center gap-1 px-2 py-2 rounded-lg border border-gray-200 text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors text-[10px]"
                title="Send to Back"
              >
                <SendToBack size={14} />
                Back
              </button>
              <button
                onClick={bringForward}
                className="flex-1 flex flex-col items-center gap-1 px-2 py-2 rounded-lg border border-gray-200 text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors text-[10px]"
                title="Bring Forward"
              >
                <ArrowUpToLine size={14} />
                Fwd
              </button>
              <button
                onClick={sendBackward}
                className="flex-1 flex flex-col items-center gap-1 px-2 py-2 rounded-lg border border-gray-200 text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors text-[10px]"
                title="Send Backward"
              >
                <ArrowDownToLine size={14} />
                Bwd
              </button>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={toggleLock}
                className="flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg border border-gray-200 text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors text-[11px]"
                title="Toggle Lock"
              >
                {selectedNode.locked ? <Unlock size={13} /> : <Lock size={13} />}
                {selectedNode.locked ? "Unlock" : "Lock"}
              </button>
              <button
                onClick={toggleVisibility}
                className="flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg border border-gray-200 text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors text-[11px]"
                title="Toggle Visibility"
              >
                <Eye size={13} />
                {selectedNode.visible === false ? "Show" : "Hide"}
              </button>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={duplicateShape}
                className="flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg border border-gray-200 text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors text-[11px]"
              >
                <Copy size={13} />
                Duplicate
              </button>
              <button
                onClick={deleteShape}
                className="flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg border border-red-200 text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors text-[11px]"
              >
                <Trash2 size={13} />
                Delete
              </button>
            </div>
          </>
        )}
        {!canEdit && (
          <div className="flex items-center gap-1.5 px-2 py-2 text-[11px] text-gray-400 bg-gray-50 rounded-lg">
            <Eye size={12} />
            View-only — no editing available
          </div>
        )}
      </Section>
    </div>
  );
}
