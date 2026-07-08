"use client";

import React, { useState, useCallback, useEffect } from "react";

const PRESET_COLORS = [
  "#ffffff", "#f8fafc", "#f1f5f9", "#e2e8f0", "#cbd5e1", "#94a3b8", "#64748b", "#475569", "#334155", "#1e293b", "#0f172a",
  "#fef2f2", "#fee2e2", "#fecaca", "#fca5a5", "#f87171", "#ef4444", "#dc2626", "#b91c1c", "#991b1b", "#7f1d1d",
  "#fff7ed", "#ffedd5", "#fed7aa", "#fdba74", "#fb923c", "#f97316", "#ea580c", "#c2410c", "#9a3412", "#7c2d12",
  "#fefce8", "#fef9c3", "#fef08a", "#fde047", "#facc15", "#eab308", "#ca8a04", "#a16207", "#854d0e", "#713f12",
  "#f0fdf4", "#dcfce7", "#bbf7d0", "#86efac", "#4ade80", "#22c55e", "#16a34a", "#15803d", "#166534", "#14532d",
  "#ecfdf5", "#d1fae5", "#a7f3d0", "#6ee7b7", "#34d399", "#10b981", "#059669", "#047857", "#065f46", "#064e3b",
  "#f0f9ff", "#e0f2fe", "#bae6fd", "#7dd3fc", "#38bdf8", "#0ea5e9", "#0284c7", "#0369a1", "#075985", "#0c4a6e",
  "#eff6ff", "#dbeafe", "#bfdbfe", "#93c5fd", "#60a5fa", "#3b82f6", "#2563eb", "#1d4ed8", "#1e40af", "#1e3a8a",
  "#faf5ff", "#f3e8ff", "#e9d5ff", "#d8b4fe", "#c084fc", "#a855f7", "#9333ea", "#7e22ce", "#6b21a8", "#581c87",
  "#fdf2f8", "#fce7f3", "#fbcfe8", "#f9a8d4", "#f472b6", "#ec4899", "#db2777", "#be185d", "#9d174d", "#831843",
  "#fff1f2", "#ffe4e6", "#fecdd3", "#fda4af", "#fb7185", "#f43f5e", "#e11d48", "#be123c", "#9f1239", "#881337",
  "#000000", "#111111", "#1a1a1a", "#262626", "#333333", "#404040", "#525252", "#666666", "#808080", "#999999",
];

const COMMON_COLORS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e", "#14b8a6", "#3b82f6", "#6366f1", "#a855f7", "#ec4899",
  "#dc2626", "#ea580c", "#ca8a04", "#16a34a", "#0d9488", "#2563eb", "#4f46e5", "#9333ea", "#db2777",
];

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!m) return null;
  return { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) };
}

function rgbToHex(r: number, g: number, b: number): string {
  return "#" + [r, g, b].map((c) => Math.round(c).toString(16).padStart(2, "0")).join("");
}

function hslToString(h: number, s: number, l: number): string {
  return `hsl(${Math.round(h)}, ${Math.round(s)}%, ${Math.round(l)}%)`;
}

function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const rgb = hexToRgb(hex);
  if (!rgb) return { h: 0, s: 0, l: 0 };
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }
  return { h: h * 360, s: s * 100, l: l * 100 };
}

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  label?: string;
}

export default function ColorPicker({ value, onChange, label }: ColorPickerProps) {
  const [mode, setMode] = useState<"hex" | "rgb" | "hsl">("hex");
  const [hexInput, setHexInput] = useState(value);
  const [recentColors, setRecentColors] = useState<string[]>([]);
  const [opacity, setOpacity] = useState(1);

  const rgb = hexToRgb(value);
  const hsl = hexToHsl(value);

  useEffect(() => {
    setHexInput(value);
  }, [value]);

  const handleHexChange = useCallback(
    (val: string) => {
      setHexInput(val);
      if (/^#[a-f\d]{6}$/i.test(val)) {
        onChange(val);
        setRecentColors((prev) => {
          const next = [val, ...prev.filter((c) => c !== val)].slice(0, 12);
          return next;
        });
      }
    },
    [onChange],
  );

  const handleRgbChange = useCallback(
    (channel: "r" | "g" | "b", val: number) => {
      if (!rgb) return;
      const newRgb = { ...rgb, [channel]: Math.max(0, Math.min(255, val || 0)) };
      const hex = rgbToHex(newRgb.r, newRgb.g, newRgb.b);
      handleHexChange(hex);
    },
    [rgb, handleHexChange],
  );

  const handleHslChange = useCallback(
    (channel: "h" | "s" | "l", val: number) => {
      const newH = channel === "h" ? val : hsl.h;
      const newS = channel === "s" ? val : hsl.s;
      const newL = channel === "l" ? val : hsl.l;
      const hex = rgbToHex(
        ...hslToRgb(newH / 360, newS / 100, newL / 100),
      );
      handleHexChange(hex);
    },
    [hsl, handleHexChange],
  );

  return (
    <div className="space-y-3">
      {label && (
        <label className="block text-[11px] font-medium text-gray-500 uppercase tracking-wider">
          {label}
        </label>
      )}

      {/* Color preview & quick pick */}
      <div className="flex items-center gap-2">
        <div className="relative shrink-0">
          <input
            type="color"
            value={value}
            onChange={(e) => handleHexChange(e.target.value)}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <div
            className="w-10 h-10 rounded-lg border border-gray-200 shadow-sm"
            style={{ backgroundColor: value }}
          />
        </div>
        <div className="flex-1">
          {mode === "hex" && (
            <div className="flex items-center gap-1">
              <span className="text-[11px] text-gray-400 font-mono">#</span>
              <input
                type="text"
                value={hexInput.replace("#", "")}
                onChange={(e) => handleHexChange("#" + e.target.value)}
                className="flex-1 px-2 py-1.5 text-[12px] font-mono border border-gray-200 rounded-lg outline-none focus:border-blue-400"
                maxLength={6}
                placeholder="000000"
              />
            </div>
          )}
          {mode === "rgb" && rgb && (
            <div className="flex gap-1">
              {(["r", "g", "b"] as const).map((ch) => (
                <div key={ch} className="flex-1 flex items-center gap-0.5">
                  <span className="text-[10px] text-gray-400 uppercase">{ch}</span>
                  <input
                    type="number"
                    min={0}
                    max={255}
                    value={rgb[ch]}
                    onChange={(e) => handleRgbChange(ch, parseInt(e.target.value))}
                    className="w-full px-1 py-1.5 text-[11px] font-mono border border-gray-200 rounded outline-none focus:border-blue-400"
                  />
                </div>
              ))}
            </div>
          )}
          {mode === "hsl" && (
            <div className="flex gap-1">
              {([{ key: "h", label: "H" }, { key: "s", label: "S" }, { key: "l", label: "L" }] as const).map(
                ({ key, label: lbl }) => (
                  <div key={key} className="flex-1 flex items-center gap-0.5">
                    <span className="text-[10px] text-gray-400">{lbl}</span>
                    <input
                      type="number"
                      min={key === "h" ? 0 : 0}
                      max={key === "h" ? 360 : 100}
                      value={Math.round(key === "h" ? hsl.h : key === "s" ? hsl.s : hsl.l)}
                      onChange={(e) => handleHslChange(key, parseFloat(e.target.value))}
                      className="w-full px-1 py-1.5 text-[11px] font-mono border border-gray-200 rounded outline-none focus:border-blue-400"
                    />
                  </div>
                ),
              )}
            </div>
          )}
        </div>
        <button
          onClick={() => setMode(mode === "hex" ? "rgb" : mode === "rgb" ? "hsl" : "hex")}
          className="text-[10px] text-gray-400 hover:text-gray-600 uppercase shrink-0"
        >
          {mode}
        </button>
      </div>

      {/* Opacity */}
      <div className="flex items-center gap-2">
        <span className="text-[11px] text-gray-400 w-12">Opacity</span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={opacity}
          onChange={(e) => setOpacity(parseFloat(e.target.value))}
          className="flex-1 h-1.5 accent-blue-500"
        />
        <span className="text-[11px] text-gray-400 w-8 text-right font-mono">
          {Math.round(opacity * 100)}%
        </span>
      </div>

      {/* Common colors */}
      <div>
        <span className="text-[10px] text-gray-400 uppercase tracking-wider">Common</span>
        <div className="flex flex-wrap gap-1 mt-1.5">
          {COMMON_COLORS.map((c) => (
            <button
              key={c}
              onClick={() => handleHexChange(c)}
              className={`w-5 h-5 rounded-full border transition-transform hover:scale-110 ${c === value ? "ring-2 ring-blue-500 ring-offset-1" : "border-gray-200"}`}
              style={{ backgroundColor: c }}
              title={c}
            />
          ))}
        </div>
      </div>

      {/* Recent colors */}
      {recentColors.length > 0 && (
        <div>
          <span className="text-[10px] text-gray-400 uppercase tracking-wider">Recent</span>
          <div className="flex flex-wrap gap-1 mt-1.5">
            {recentColors.map((c) => (
              <button
                key={c}
                onClick={() => handleHexChange(c)}
                className={`w-5 h-5 rounded-full border transition-transform hover:scale-110 ${c === value ? "ring-2 ring-blue-500 ring-offset-1" : "border-gray-200"}`}
                style={{ backgroundColor: c }}
                title={c}
              />
            ))}
          </div>
        </div>
      )}

      {/* Presets */}
      <div>
        <span className="text-[10px] text-gray-400 uppercase tracking-wider">All Colors</span>
        <div className="flex flex-wrap gap-0.5 mt-1.5">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              onClick={() => handleHexChange(c)}
              className={`w-4 h-4 rounded-sm border transition-transform hover:scale-110 ${c === value ? "ring-1 ring-blue-500" : "border-gray-100"}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  let r: number, g: number, b: number;
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}
